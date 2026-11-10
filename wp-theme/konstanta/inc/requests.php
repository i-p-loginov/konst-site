<?php
/**
 * Заявки с сайта: приём формы, хранение в админке, уведомление на почту.
 *
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'init',
	function () {
		register_post_type(
			'konst_request',
			array(
				'labels'          => array(
					'name'          => 'Заявки',
					'singular_name' => 'Заявка',
					'all_items'     => 'Все заявки',
					'edit_item'     => 'Заявка',
					'menu_name'     => 'Заявки',
					'not_found'     => 'Заявок пока нет',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_rest'    => false,
				'menu_position'   => 20,
				'menu_icon'       => 'dashicons-email-alt',
				'supports'        => array( 'title' ),
				'capability_type' => 'post',
				'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'    => true,
			)
		);
	}
);

/** Поля заявки: ключ => подпись. */
function konstanta_request_fields() {
	return array(
		'name'    => 'Имя',
		'phone'   => 'Телефон',
		'email'   => 'Email',
		'branch'  => 'Отделение',
		'message' => 'Сообщение',
		'page'    => 'Страница',
	);
}

/** Адреса для уведомлений. */
function konstanta_request_emails() {
	$raw    = get_option( 'konstanta_request_emails', '' );
	$emails = array_filter( array_map( 'sanitize_email', preg_split( '/[\s,;]+/', (string) $raw ) ) );
	return $emails ? $emails : array( get_option( 'admin_email' ) );
}

/* ---------- приём формы ---------- */

add_action( 'admin_post_nopriv_konstanta_request', 'konstanta_handle_request' );
add_action( 'admin_post_konstanta_request', 'konstanta_handle_request' );

/** Обработка отправки формы. */
function konstanta_handle_request() {
	$back = wp_get_referer();
	if ( ! $back ) {
		$back = home_url( '/' );
	}
	$back = remove_query_arg( 'zayavka', $back );

	$fail = function ( $code ) use ( $back ) {
		wp_safe_redirect( add_query_arg( 'zayavka', $code, $back ) . '#zayavka' );
		exit;
	};

	if ( ! isset( $_POST['konstanta_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['konstanta_nonce'] ), 'konstanta_request' ) ) {
		$fail( 'expired' );
	}
	// Ловушка для ботов: скрытое поле должно остаться пустым.
	if ( ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( add_query_arg( 'zayavka', 'ok', $back ) . '#zayavka' );
		exit;
	}

	$data = array(
		'name'    => sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) ),
		'phone'   => sanitize_text_field( wp_unslash( $_POST['phone'] ?? '' ) ),
		'email'   => sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ),
		'branch'  => sanitize_text_field( wp_unslash( $_POST['branch'] ?? '' ) ),
		'message' => sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) ),
		'page'    => esc_url_raw( $back ),
	);
	$agree = ! empty( $_POST['agree'] );

	if ( '' === $data['name'] || strlen( preg_replace( '/\D/', '', $data['phone'] ) ) < 10 || ( '' !== $data['email'] && ! is_email( $data['email'] ) ) || ! $agree ) {
		$fail( 'invalid' );
	}

	$post_id = wp_insert_post(
		array(
			'post_type'   => 'konst_request',
			'post_status' => 'private',
			'post_title'  => $data['name'] . ' — ' . $data['phone'],
		)
	);
	if ( $post_id && ! is_wp_error( $post_id ) ) {
		foreach ( $data as $k => $v ) {
			update_post_meta( $post_id, '_konst_' . $k, $v );
		}
	}

	$lines = array();
	foreach ( konstanta_request_fields() as $k => $label ) {
		if ( '' !== $data[ $k ] ) {
			$lines[] = $label . ': ' . $data[ $k ];
		}
	}
	if ( $post_id && ! is_wp_error( $post_id ) ) {
		$lines[] = '';
		$lines[] = 'Заявка в админке: ' . admin_url( 'post.php?post=' . $post_id . '&action=edit' );
	}
	$headers = $data['email'] ? array( 'Reply-To: ' . $data['name'] . ' <' . $data['email'] . '>' ) : array();
	$sent    = wp_mail( konstanta_request_emails(), 'Новая заявка с сайта: ' . $data['name'], implode( "\n", $lines ), $headers );
	if ( $post_id && ! is_wp_error( $post_id ) ) {
		update_post_meta( $post_id, '_konst_mailed', $sent ? '1' : '0' );
	}

	wp_safe_redirect( add_query_arg( 'zayavka', 'ok', $back ) . '#zayavka' );
	exit;
}

/* ---------- просмотр заявок в админке ---------- */

add_action(
	'add_meta_boxes_konst_request',
	function () {
		add_meta_box(
			'konstanta_request',
			'Данные заявки',
			function ( $post ) {
				echo '<table class="form-table"><tbody>';
				foreach ( konstanta_request_fields() as $k => $label ) {
					$v = get_post_meta( $post->ID, '_konst_' . $k, true );
					echo '<tr><th>' . esc_html( $label ) . '</th><td>';
					if ( 'email' === $k && $v ) {
						echo '<a href="mailto:' . esc_attr( $v ) . '">' . esc_html( $v ) . '</a>';
					} elseif ( 'phone' === $k && $v ) {
						echo '<a href="tel:' . esc_attr( preg_replace( '/[^\d+]/', '', $v ) ) . '">' . esc_html( $v ) . '</a>';
					} else {
						echo nl2br( esc_html( $v ) );
					}
					echo '</td></tr>';
				}
				$mailed = get_post_meta( $post->ID, '_konst_mailed', true );
				echo '<tr><th>Уведомление на почту</th><td>' . ( '1' === $mailed ? 'отправлено' : '<strong style="color:#b32d2e">не отправлено — проверьте настройку почты на сервере</strong>' ) . '</td></tr>';
				echo '<tr><th>Получено</th><td>' . esc_html( get_the_date( 'd.m.Y H:i', $post ) ) . '</td></tr>';
				echo '</tbody></table>';
			},
			'konst_request',
			'normal',
			'high'
		);
	}
);

add_filter(
	'manage_konst_request_posts_columns',
	function () {
		return array(
			'cb'           => '<input type="checkbox">',
			'title'        => 'Заявка',
			'konst_email'  => 'Email',
			'konst_branch' => 'Отделение',
			'konst_date'   => 'Получена',
		);
	}
);
add_action(
	'manage_konst_request_posts_custom_column',
	function ( $col, $post_id ) {
		if ( 'konst_email' === $col ) {
			echo esc_html( get_post_meta( $post_id, '_konst_email', true ) );
		} elseif ( 'konst_branch' === $col ) {
			echo esc_html( get_post_meta( $post_id, '_konst_branch', true ) );
		} elseif ( 'konst_date' === $col ) {
			echo esc_html( get_the_date( 'd.m.Y H:i', $post_id ) );
		}
	},
	10,
	2
);

/* ---------- настройки ---------- */

add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'edit.php?post_type=konst_request',
			'Настройки заявок',
			'Настройки',
			'manage_options',
			'konstanta-requests',
			function () {
				?>
				<div class="wrap">
					<h1>Настройки заявок</h1>
					<form method="post" action="options.php">
						<?php settings_fields( 'konstanta_requests' ); ?>
						<table class="form-table" role="presentation">
							<tr>
								<th scope="row"><label for="konstanta_request_emails">Куда отправлять заявки</label></th>
								<td>
									<input type="text" class="large-text" id="konstanta_request_emails" name="konstanta_request_emails" value="<?php echo esc_attr( get_option( 'konstanta_request_emails', '' ) ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>">
									<p class="description">Один или несколько адресов через запятую. Если пусто — заявки уходят на адрес администратора сайта. Все заявки также сохраняются в разделе «Заявки».</p>
								</td>
							</tr>
						</table>
						<?php submit_button(); ?>
					</form>
				</div>
				<?php
			}
		);
	}
);
add_action(
	'admin_init',
	function () {
		register_setting(
			'konstanta_requests',
			'konstanta_request_emails',
			array(
				'type'              => 'string',
				'sanitize_callback' => function ( $v ) {
					return implode( ', ', array_filter( array_map( 'sanitize_email', preg_split( '/[\s,;]+/', (string) $v ) ) ) );
				},
			)
		);
	}
);
