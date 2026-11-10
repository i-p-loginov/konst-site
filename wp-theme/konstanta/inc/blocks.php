<?php
/**
 * Блоки темы: карта отделений и форма заявки.
 *
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'init',
	function () {
		$uri = get_theme_file_uri( 'assets/js' );
		wp_register_script(
			'konstanta-editor',
			$uri . '/editor.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render', 'wp-dom-ready' ),
			KONSTANTA_VERSION,
			true
		);
		wp_register_script( 'konstanta-map', $uri . '/map.js', array(), KONSTANTA_VERSION, array( 'in_footer' => true ) );

		register_block_type( get_theme_file_path( 'blocks/branch-map' ) );
		register_block_type( get_theme_file_path( 'blocks/request-form' ) );
	}
);

/**
 * Ссылка на страницу по её адресу (slug), с запасным вариантом.
 *
 * @param string $slug Адрес страницы.
 * @return string
 */
function konstanta_page_url( $slug ) {
	$page = get_page_by_path( $slug );
	return $page ? get_permalink( $page ) : home_url( '/' . $slug . '/' );
}
