<?php
/**
 * Подключение стилей и скриптов, стили кнопок, категория паттернов.
 *
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'after_setup_theme',
	function () {
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'editor-styles' );
		add_theme_support( 'responsive-embeds' );
		add_editor_style(
			array(
				'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap',
				'assets/css/main.css',
				'assets/css/blocks.css',
				'assets/css/editor.css',
			)
		);
	}
);

add_action(
	'wp_enqueue_scripts',
	function () {
		$uri = get_theme_file_uri( 'assets' );
		wp_enqueue_style( 'konstanta-fonts', 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap', array(), null );
		wp_enqueue_style( 'konstanta-main', $uri . '/css/main.css', array(), KONSTANTA_VERSION );
		wp_enqueue_style( 'konstanta-blocks', $uri . '/css/blocks.css', array( 'konstanta-main' ), KONSTANTA_VERSION );
		wp_enqueue_script( 'konstanta-main', $uri . '/js/main.js', array(), KONSTANTA_VERSION, array( 'in_footer' => true ) );
	}
);

add_action(
	'wp_head',
	function () {
		if ( ! has_site_icon() ) {
			echo '<link rel="icon" href="' . esc_url( get_theme_file_uri( 'assets/brand/favicon.svg' ) ) . '" type="image/svg+xml">' . "\n";
		}
	}
);

/* Стили кнопок, которые можно выбрать в редакторе. */
add_action(
	'init',
	function () {
		$styles = array(
			'primary'       => 'Жёлтая',
			'secondary'     => 'Бирюзовая',
			'line'          => 'Контурная',
			'line-light'    => 'Контурная светлая',
		);
		foreach ( $styles as $name => $label ) {
			register_block_style(
				'core/button',
				array(
					'name'       => $name,
					'label'      => $label,
					'is_default' => 'primary' === $name,
				)
			);
		}
		register_block_pattern_category( 'konstanta-pages', array( 'label' => 'Константа: страницы' ) );
		register_block_pattern_category( 'konstanta-sections', array( 'label' => 'Константа: секции' ) );
	},
	20
);
