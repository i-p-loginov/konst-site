<?php
/**
 * Отделения и участки: тип записей «Отделения», редактируемый в админке,
 * и данные для интерактивной карты.
 *
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

/**
 * Районы схематической карты Ленобласти (assets/map.svg).
 * id => [название района, x подписи, y подписи].
 */
function konstanta_map_regions() {
	return array(
		'vyborgskiy'     => array( 'Выборгский район', 150, 110 ),
		'vsevolozhskiy'  => array( 'Всеволожский район', 295, 200 ),
		'kirovskiy'      => array( 'Кировский район', 385, 195 ),
		'volkhovskiy'    => array( 'Волховский район', 490, 185 ),
		'lodeynopolskiy' => array( 'Лодейнопольский район', 620, 120 ),
		'tikhvinskiy'    => array( 'Тихвинский район', 590, 235 ),
		'boksitogorskiy' => array( 'Бокситогорский район', 710, 250 ),
		'kirishskiy'     => array( 'Киришский район', 485, 305 ),
		'tosnenskiy'     => array( 'Тосненский район', 375, 325 ),
		'gatchinskiy'    => array( 'Гатчинский район', 235, 355 ),
		'sosnovoborskiy' => array( 'Сосновый Бор', 90, 255 ),
		'volosovskiy'    => array( 'Волосовский район', 125, 400 ),
		'kingiseppskiy'  => array( 'Кингисеппский район', 42, 385 ),
		'slantsevskiy'   => array( 'Сланцевский район', 75, 510 ),
		'luzhskiy'       => array( 'Лужский район', 220, 490 ),
	);
}

add_action(
	'init',
	function () {
		register_post_type(
			'konst_branch',
			array(
				'labels'          => array(
					'name'          => 'Отделения',
					'singular_name' => 'Отделение',
					'add_new'       => 'Добавить отделение',
					'add_new_item'  => 'Новое отделение',
					'edit_item'     => 'Редактировать отделение',
					'all_items'     => 'Все отделения',
					'menu_name'     => 'Отделения',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'show_in_rest'    => false,
				'menu_position'   => 21,
				'menu_icon'       => 'dashicons-location-alt',
				'supports'        => array( 'title', 'page-attributes' ),
				'capability_type' => 'page',
				'map_meta_cap'    => true,
			)
		);
	}
);

add_action(
	'add_meta_boxes_konst_branch',
	function () {
		add_meta_box( 'konstanta_branch', 'Данные для карты и формы', 'konstanta_branch_metabox', 'konst_branch', 'normal', 'high' );
	}
);

/**
 * Поля отделения.
 *
 * @param WP_Post $post Отделение.
 */
function konstanta_branch_metabox( $post ) {
	$short   = get_post_meta( $post->ID, '_konst_short', true );
	$text    = get_post_meta( $post->ID, '_konst_text', true );
	$sites   = get_post_meta( $post->ID, '_konst_sites', true );
	$regions = (array) get_post_meta( $post->ID, '_konst_regions', true );
	$taken   = konstanta_regions_taken( $post->ID );
	wp_nonce_field( 'konstanta_branch', 'konstanta_branch_nonce' );
	?>
	<p>
		<label for="konst_short"><strong>Короткое название на карте</strong></label><br>
		<input type="text" id="konst_short" name="konst_short" value="<?php echo esc_attr( $short ); ?>" class="regular-text" placeholder="Например: Выборгское">
	</p>
	<p>
		<label for="konst_text"><strong>Описание</strong> — показывается справа от карты при выборе отделения</label><br>
		<textarea id="konst_text" name="konst_text" rows="3" class="large-text"><?php echo esc_textarea( $text ); ?></textarea>
	</p>
	<p>
		<label for="konst_sites"><strong>Участки в составе</strong> — по одному на строку</label><br>
		<textarea id="konst_sites" name="konst_sites" rows="3" class="large-text" placeholder="Сланцевский участок"><?php echo esc_textarea( $sites ); ?></textarea>
	</p>
	<fieldset>
		<legend><strong>Территория на карте</strong> — районы, которые подсвечиваются при выборе отделения. Первый отмеченный район получает подпись с названием отделения, остальные — подписи участков.</legend>
		<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px 16px;margin-top:8px;">
		<?php foreach ( konstanta_map_regions() as $id => $region ) : ?>
			<label>
				<input type="checkbox" name="konst_regions[]" value="<?php echo esc_attr( $id ); ?>" <?php checked( in_array( $id, $regions, true ) ); ?>>
				<?php echo esc_html( $region[0] ); ?>
				<?php if ( isset( $taken[ $id ] ) ) : ?>
					<span style="color:#8a6d00">(сейчас у «<?php echo esc_html( $taken[ $id ] ); ?>»)</span>
				<?php endif; ?>
			</label>
		<?php endforeach; ?>
		</div>
	</fieldset>
	<p class="description">Порядок отделений в списке под картой и в форме заявки задаётся полем «Порядок» справа. Чтобы скрыть отделение, переведите его в черновик.</p>
	<?php
}

/**
 * Районы, закреплённые за другими опубликованными отделениями.
 *
 * @param int $except ID текущего отделения.
 * @return array region_id => название отделения.
 */
function konstanta_regions_taken( $except = 0 ) {
	$out = array();
	foreach ( konstanta_get_branches() as $b ) {
		if ( (int) $b['id'] === (int) $except ) {
			continue;
		}
		foreach ( $b['regions'] as $r ) {
			$out[ $r ] = $b['name'];
		}
	}
	return $out;
}

add_action(
	'save_post_konst_branch',
	function ( $post_id ) {
		if ( ! isset( $_POST['konstanta_branch_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['konstanta_branch_nonce'] ), 'konstanta_branch' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$allowed = array_keys( konstanta_map_regions() );
		$regions = isset( $_POST['konst_regions'] ) ? array_map( 'sanitize_key', (array) wp_unslash( $_POST['konst_regions'] ) ) : array();
		$regions = array_values( array_intersect( $regions, $allowed ) );
		update_post_meta( $post_id, '_konst_short', sanitize_text_field( wp_unslash( $_POST['konst_short'] ?? '' ) ) );
		update_post_meta( $post_id, '_konst_text', sanitize_textarea_field( wp_unslash( $_POST['konst_text'] ?? '' ) ) );
		update_post_meta( $post_id, '_konst_sites', sanitize_textarea_field( wp_unslash( $_POST['konst_sites'] ?? '' ) ) );
		update_post_meta( $post_id, '_konst_regions', $regions );
	}
);

/* Колонки в списке отделений. */
add_filter(
	'manage_konst_branch_posts_columns',
	function ( $cols ) {
		return array(
			'cb'             => $cols['cb'],
			'title'          => 'Отделение',
			'konst_sites'    => 'Участки',
			'konst_regions'  => 'Районы на карте',
			'konst_order'    => 'Порядок',
		);
	}
);
add_action(
	'manage_konst_branch_posts_custom_column',
	function ( $col, $post_id ) {
		if ( 'konst_sites' === $col ) {
			echo esc_html( implode( ', ', konstanta_lines( get_post_meta( $post_id, '_konst_sites', true ) ) ) );
		} elseif ( 'konst_regions' === $col ) {
			$all = konstanta_map_regions();
			$names = array();
			foreach ( (array) get_post_meta( $post_id, '_konst_regions', true ) as $r ) {
				if ( isset( $all[ $r ] ) ) {
					$names[] = $all[ $r ][0];
				}
			}
			echo esc_html( implode( ', ', $names ) );
		} elseif ( 'konst_order' === $col ) {
			echo (int) get_post_field( 'menu_order', $post_id );
		}
	},
	10,
	2
);
add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( is_admin() && $q->is_main_query() && 'konst_branch' === $q->get( 'post_type' ) && ! $q->get( 'orderby' ) ) {
			$q->set( 'orderby', 'menu_order title' );
			$q->set( 'order', 'ASC' );
		}
	}
);

/**
 * Строки текста без пустых.
 *
 * @param string $text Текст.
 * @return string[]
 */
function konstanta_lines( $text ) {
	return array_values( array_filter( array_map( 'trim', preg_split( '/\R/', (string) $text ) ) ) );
}

/**
 * Опубликованные отделения в порядке вывода.
 *
 * @return array[]
 */
function konstanta_get_branches() {
	$posts = get_posts(
		array(
			'post_type'      => 'konst_branch',
			'post_status'    => 'publish',
			'posts_per_page' => 100,
			'orderby'        => array(
				'menu_order' => 'ASC',
				'title'      => 'ASC',
			),
		)
	);
	$out = array();
	foreach ( $posts as $p ) {
		$short = get_post_meta( $p->ID, '_konst_short', true );
		$out[] = array(
			'id'      => $p->ID,
			'key'     => 'b' . $p->ID,
			'name'    => get_the_title( $p ),
			'short'   => $short ? $short : get_the_title( $p ),
			'text'    => (string) get_post_meta( $p->ID, '_konst_text', true ),
			'sites'   => konstanta_lines( get_post_meta( $p->ID, '_konst_sites', true ) ),
			'regions' => array_values( (array) get_post_meta( $p->ID, '_konst_regions', true ) ),
		);
	}
	return $out;
}

/**
 * Исходная структура отделений (заполняется при активации темы).
 *
 * @return array[]
 */
function konstanta_default_branches() {
	return array(
		array( 'Волховское отделение', 'Волховское', array( 'volkhovskiy' ), array(), 'Волховское отделение. Проверки, эксплуатация и установка приборов учёта в зоне ответственности отделения.' ),
		array( 'Выборгское отделение', 'Выборгское', array( 'vyborgskiy' ), array(), 'Выборгское отделение. Проверки, эксплуатация и установка приборов учёта, сопровождение подключения.' ),
		array( 'Гатчинское отделение', 'Гатчинское', array( 'gatchinskiy' ), array(), 'Гатчинское отделение. Работы по учёту электроэнергии и сопровождение до включения.' ),
		array( 'Кингисеппское отделение', 'Кингисеппское', array( 'kingiseppskiy', 'slantsevskiy', 'volosovskiy' ), array( 'Сланцевский участок', 'Волосовский участок' ), 'Кингисеппское отделение. В состав входят Сланцевский и Волосовский участки.' ),
		array( 'Киришское отделение', 'Киришское', array( 'kirishskiy' ), array(), 'Киришское отделение. Проверки, эксплуатация и установка приборов учёта.' ),
		array( 'Кировское отделение', 'Кировское', array( 'kirovskiy' ), array(), 'Кировское отделение. Работы по учёту электроэнергии и подключению объектов.' ),
		array( 'Лодейнопольское отделение', 'Лодейнопольское', array( 'lodeynopolskiy' ), array(), 'Лодейнопольское отделение. Работы по учёту электроэнергии в зоне отделения.' ),
		array( 'Лужское отделение', 'Лужское', array( 'luzhskiy' ), array(), 'Лужское отделение. Проверки, эксплуатация и установка приборов учёта.' ),
		array( 'Пригородное отделение', 'Пригородное', array( 'vsevolozhskiy' ), array( 'Всеволожский участок' ), 'Пригородное отделение. В состав входит Всеволожский участок.' ),
		array( 'Сосновоборский участок', 'Сосновоборский', array( 'sosnovoborskiy' ), array(), 'Сосновоборский участок — самостоятельное структурное подразделение (не входит в состав отделений).' ),
		array( 'Тихвинское отделение', 'Тихвинское', array( 'tikhvinskiy', 'boksitogorskiy' ), array( 'Бокситогорский участок' ), 'Тихвинское отделение. В состав входит Бокситогорский участок.' ),
		array( 'Тосненское отделение', 'Тосненское', array( 'tosnenskiy' ), array(), 'Тосненское отделение. Проверки, эксплуатация и установка приборов учёта.' ),
	);
}
