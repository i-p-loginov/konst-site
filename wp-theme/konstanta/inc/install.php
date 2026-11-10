<?php
/**
 * Первичное наполнение сайта при активации темы: страницы, меню,
 * главная страница, отделения, постоянные ссылки.
 *
 * Ничего не перезаписывает: существующие страницы, меню и отделения
 * остаются как есть. Повторить наполнение можно в «Внешний вид →
 * Наполнение Константы».
 *
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

/** Страницы сайта: slug => [заголовок, порядок в меню (0 — не в меню)]. */
function konstanta_pages() {
	return array(
		'glavnaya'   => array( 'Главная', 1 ),
		'uslugi'     => array( 'Услуги', 2 ),
		'o-kompanii' => array( 'О компании', 3 ),
		'geografiya' => array( 'География', 4 ),
		'vakansii'   => array( 'Вакансии', 5 ),
		'kontakty'   => array( 'Контакты', 6 ),
		'sout'       => array( 'Результаты СОУТ', 0 ),
		'privacy'    => array( 'Политика обработки персональных данных', 0 ),
	);
}

/**
 * Содержимое паттерна темы.
 *
 * @param string $file Имя файла в /patterns без расширения.
 * @return string
 */
function konstanta_pattern_content( $file ) {
	$path = get_theme_file_path( 'patterns/' . $file . '.php' );
	if ( ! file_exists( $path ) ) {
		return '';
	}
	ob_start();
	include $path;
	$html = ob_get_clean();
	// Отрезаем шапку-комментарий паттерна (всё до первого блока).
	$pos = strpos( $html, '<!-- wp:' );
	return false === $pos ? trim( $html ) : trim( substr( $html, $pos ) );
}

/**
 * Наполнение сайта.
 *
 * @return string[] Журнал действий.
 */
function konstanta_install() {
	$log = array();

	// Постоянные ссылки вида /uslugi/ — на них завязаны ссылки в контенте.
	if ( ! get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
		$log[] = 'Включены постоянные ссылки вида /%postname%/.';
	}
	if ( in_array( get_option( 'blogname' ), array( '', 'My WordPress Website', 'Мой сайт', 'Ещё один сайт на WordPress' ), true ) || ! get_option( 'konstanta_installed' ) ) {
		update_option( 'blogname', 'Константа' );
		update_option( 'blogdescription', 'Партнёр АО «ЛОЭСК»' );
	}

	// Страницы.
	$ids = array();
	foreach ( konstanta_pages() as $slug => $page ) {
		$existing = get_page_by_path( $slug, OBJECT, 'page' );
		if ( $existing ) {
			$ids[ $slug ] = $existing->ID;
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => $page[0],
				'post_name'    => $slug,
				'menu_order'   => $page[1],
				'post_content' => wp_slash( konstanta_pattern_content( 'page-' . $slug ) ),
			)
		);
		if ( $id && ! is_wp_error( $id ) ) {
			$ids[ $slug ] = $id;
			$log[]        = 'Создана страница «' . $page[0] . '».';
		}
	}

	// Главная и политика конфиденциальности.
	if ( isset( $ids['glavnaya'] ) && 'page' !== get_option( 'show_on_front' ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $ids['glavnaya'] );
		$log[] = 'Страница «Главная» назначена главной страницей сайта.';
	}
	if ( isset( $ids['privacy'] ) ) {
		$current = (int) get_option( 'wp_page_for_privacy_policy' );
		if ( ! $current || 'publish' !== get_post_status( $current ) ) {
			update_option( 'wp_page_for_privacy_policy', $ids['privacy'] );
		}
	}

	// Меню шапки (блок «Навигация» берёт последнее меню автоматически).
	$menus = get_posts(
		array(
			'post_type'   => 'wp_navigation',
			'post_status' => 'publish',
			'numberposts' => 1,
		)
	);
	if ( ! $menus ) {
		$links = '';
		foreach ( konstanta_pages() as $slug => $page ) {
			if ( ! $page[1] || ! isset( $ids[ $slug ] ) ) {
				continue;
			}
			$links .= serialize_block(
				array(
					'blockName'    => 'core/navigation-link',
					'attrs'        => array(
						'label' => $page[0],
						'type'  => 'page',
						'id'    => $ids[ $slug ],
						'url'   => get_permalink( $ids[ $slug ] ),
						'kind'  => 'post-type',
					),
					'innerBlocks'  => array(),
					'innerHTML'    => '',
					'innerContent' => array(),
				)
			) . "\n";
		}
		wp_insert_post(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_title'   => 'Главное меню',
				'post_content' => wp_slash( $links ),
			)
		);
		$log[] = 'Создано главное меню.';
	}

	// Отделения.
	$has_branches = get_posts(
		array(
			'post_type'   => 'konst_branch',
			'post_status' => 'any',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( ! $has_branches ) {
		foreach ( konstanta_default_branches() as $i => $b ) {
			$id = wp_insert_post(
				array(
					'post_type'   => 'konst_branch',
					'post_status' => 'publish',
					'post_title'  => $b[0],
					'menu_order'  => ( $i + 1 ) * 10,
				)
			);
			if ( $id && ! is_wp_error( $id ) ) {
				update_post_meta( $id, '_konst_short', $b[1] );
				update_post_meta( $id, '_konst_regions', $b[2] );
				update_post_meta( $id, '_konst_sites', implode( "\n", $b[3] ) );
				update_post_meta( $id, '_konst_text', $b[4] );
			}
		}
		$log[] = 'Заполнены отделения и участки (' . count( konstanta_default_branches() ) . ').';
	}

	flush_rewrite_rules( false );
	update_option( 'konstanta_installed', KONSTANTA_VERSION );
	return $log;
}

add_action(
	'after_switch_theme',
	function () {
		$log = konstanta_install();
		if ( $log ) {
			set_transient( 'konstanta_install_log', $log, 300 );
		}
	}
);

add_action(
	'admin_notices',
	function () {
		$log = get_transient( 'konstanta_install_log' );
		if ( ! $log || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		delete_transient( 'konstanta_install_log' );
		echo '<div class="notice notice-success is-dismissible"><p><strong>Тема «Константа» подготовила сайт:</strong></p><ul style="list-style:disc;padding-left:1.5em">';
		foreach ( $log as $line ) {
			echo '<li>' . esc_html( $line ) . '</li>';
		}
		echo '</ul></div>';
	}
);

/* Страница «Внешний вид → Наполнение Константы»: подсказки и повторный запуск. */
add_action(
	'admin_menu',
	function () {
		add_theme_page(
			'Наполнение сайта',
			'Наполнение Константы',
			'manage_options',
			'konstanta-install',
			function () {
				$log = null;
				if ( isset( $_POST['konstanta_run'] ) && check_admin_referer( 'konstanta_install' ) ) {
					$log = konstanta_install();
				}
				?>
				<div class="wrap">
					<h1>Тема «Константа»</h1>
					<?php if ( null !== $log ) : ?>
						<div class="notice notice-success"><p><?php echo $log ? esc_html( implode( ' ', $log ) ) : 'Всё уже на месте — ничего не изменено.'; ?></p></div>
					<?php endif; ?>
					<h2>Где что редактируется</h2>
					<ul style="list-style:disc;padding-left:1.5em">
						<li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=page' ) ); ?>">Страницы</a> — тексты, картинки, кнопки и секции каждой страницы. Готовые секции и целые страницы есть в библиотеке блоков, раздел «Паттерны → Константа».</li>
						<li><a href="<?php echo esc_url( admin_url( 'site-editor.php?postType=wp_template_part' ) ); ?>">Шапка и подвал</a> — «Внешний вид → Редактор → Паттерны → Части шаблона».</li>
						<li><a href="<?php echo esc_url( admin_url( 'site-editor.php?postType=wp_navigation' ) ); ?>">Меню</a> — «Внешний вид → Редактор → Навигация».</li>
						<li><a href="<?php echo esc_url( admin_url( 'options-general.php' ) ); ?>">Название и подпись под логотипом</a> — «Настройки → Общие».</li>
						<li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=konst_branch' ) ); ?>">Отделения</a> — карта на странице «География» и список в форме заявки.</li>
						<li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=konst_request' ) ); ?>">Заявки</a> — всё, что пришло через форму, и адреса для уведомлений.</li>
					</ul>
					<h2>Повторное наполнение</h2>
					<p>Создаёт недостающие страницы, меню и отделения. Существующие страницы и записи не изменяются — чтобы вернуть исходный текст страницы, удалите её и запустите наполнение снова.</p>
					<form method="post">
						<?php wp_nonce_field( 'konstanta_install' ); ?>
						<?php submit_button( 'Создать недостающее', 'secondary', 'konstanta_run', false ); ?>
					</form>
				</div>
				<?php
			}
		);
	}
);
