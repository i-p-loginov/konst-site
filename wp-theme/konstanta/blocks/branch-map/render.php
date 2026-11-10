<?php
/**
 * Вывод блока «Карта отделений».
 *
 * @var array $attributes Атрибуты блока.
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

$branches = konstanta_get_branches();
$regions  = konstanta_map_regions();
$svg      = (string) file_get_contents( get_theme_file_path( 'assets/map.svg' ) );

// Подписи на карте строятся из данных отделений.
$labels   = '';
$assigned = array();
foreach ( $branches as $b ) {
	foreach ( $b['regions'] as $i => $rid ) {
		if ( ! isset( $regions[ $rid ] ) || isset( $assigned[ $rid ] ) ) {
			continue;
		}
		$assigned[ $rid ] = $b['key'];
		list( $rname, $x, $y ) = $regions[ $rid ];
		if ( 0 === $i ) {
			$labels .= sprintf( '<text class="map-label" data-for="%s" x="%d" y="%d">%s</text>', esc_attr( $b['key'] ), $x, $y, esc_html( $b['short'] ) );
		} else {
			$site = preg_replace( '/\s*район$/u', '', $rname ) . ' уч.';
			$labels .= sprintf( '<text class="map-label map-label-site" data-for="%s" x="%d" y="%d">%s</text>', esc_attr( $b['key'] ), $x, $y, esc_html( $site ) );
		}
	}
}
$svg = preg_replace( '#<g class="map-labels".*?</g>#s', '<g class="map-labels" aria-hidden="true">' . $labels . '</g>', $svg );
// Привязка районов к отделениям — из админки, а не из файла карты.
$svg = preg_replace( '/\s(data-branch|data-site)="[^"]*"/', '', $svg );
$svg = preg_replace_callback(
	'/<path class="map-district[^"]*" data-id="([a-z]+)"/',
	function ( $m ) use ( $branches, $assigned ) {
		$cls = 'map-district';
		if ( isset( $assigned[ $m[1] ] ) ) {
			foreach ( $branches as $b ) {
				if ( $b['key'] === $assigned[ $m[1] ] && array_search( $m[1], $b['regions'], true ) > 0 ) {
					$cls .= ' map-district-site';
				}
			}
		}
		return '<path class="' . $cls . '" data-id="' . $m[1] . '"';
	},
	$svg
);
$svg = preg_replace( '/<!--.*?-->/s', '', $svg );

$initial = '';
foreach ( $branches as $b ) {
	if ( $b['name'] === $attributes['initial'] || $b['short'] === $attributes['initial'] ) {
		$initial = $b['key'];
	}
}

$data = array_map(
	function ( $b ) {
		return array(
			'key'     => $b['key'],
			'name'    => $b['name'],
			'text'    => $b['text'],
			'sites'   => $b['sites'],
			'regions' => $b['regions'],
		);
	},
	$branches
);

$button_url = $attributes['buttonUrl'] ? $attributes['buttonUrl'] : konstanta_page_url( 'kontakty' );
$wrapper    = get_block_wrapper_attributes(
	array(
		'class'               => 'branch-map',
		'data-region-map'     => '',
		'data-branches'       => wp_json_encode( $data ),
		'data-initial'        => $initial,
		'data-sites-label'    => $attributes['sitesLabel'],
	)
);
?>
<div <?php echo $wrapper; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
	<div class="map-layout reveal">
		<div class="map-stage" data-map-svg>
			<?php echo $svg; // phpcs:ignore WordPress.Security.EscapeOutput -- SVG из файла темы, подписи экранированы. ?>
		</div>
		<aside class="map-panel">
			<h3 data-map-title><?php echo esc_html( $attributes['panelTitle'] ); ?></h3>
			<p data-map-text><?php echo esc_html( $attributes['panelText'] ); ?></p>
			<div class="map-sites" data-map-sites hidden></div>
			<?php if ( $attributes['buttonText'] ) : ?>
				<a class="btn btn-secondary" href="<?php echo esc_url( $button_url ); ?>"><?php echo esc_html( $attributes['buttonText'] ); ?></a>
			<?php endif; ?>
		</aside>
	</div>
	<ul class="district-list branch-list reveal" data-district-list>
		<?php foreach ( $branches as $b ) : ?>
			<li class="branch-item">
				<button type="button" data-branch="<?php echo esc_attr( $b['key'] ); ?>"><?php echo esc_html( $b['name'] ); ?></button>
				<?php if ( $b['sites'] ) : ?>
					<ul class="branch-sites">
						<?php foreach ( $b['sites'] as $s ) : ?>
							<li><?php echo esc_html( $s ); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
