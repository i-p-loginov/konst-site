<?php
/**
 * Title: Шапка сайта
 * Slug: konstanta/header
 * Inserter: no
 * Description: Содержимое части шаблона «Шапка сайта». Сгенерировано wp-theme/tools/build-patterns.cjs.
 */
?>
<!-- wp:group {"tagName":"header","className":"site-header","layout":{"type":"default"}} -->
<header class="wp-block-group site-header"><!-- wp:group {"className":"container header-inner","layout":{"type":"default"}} -->
<div class="wp-block-group container header-inner"><!-- wp:group {"className":"logo","layout":{"type":"default"}} -->
<div class="wp-block-group logo"><!-- wp:image {"width":"42px","height":"42px","linkDestination":"custom","className":"logo-mark"} -->
<figure class="wp-block-image is-resized logo-mark"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><img src="<?php echo esc_url( get_theme_file_uri() ); ?>/assets/brand/logo-mark.svg" alt="Константа" style="width:42px;height:42px"/></a></figure>
<!-- /wp:image -->

<!-- wp:group {"className":"logo-words","layout":{"type":"default"}} -->
<div class="wp-block-group logo-words"><!-- wp:site-title {"level":0,"className":"logo-text"} /-->

<!-- wp:site-tagline {"className":"logo-tag"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:navigation {"className":"nav","layout":{"type":"flex","justifyContent":"center"}} /-->

<!-- wp:group {"className":"header-cta","layout":{"type":"default"}} -->
<div class="wp-block-group header-cta"><!-- wp:paragraph {"className":"header-phone"} -->
<p class="header-phone"><a href="<?php echo esc_url( home_url( '/' ) ); ?>kontakty/">ООО «Константа»</a></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"className":"btn-group"} -->
<div class="wp-block-buttons btn-group"><!-- wp:button {"className":"is-style-primary"} -->
<div class="wp-block-button is-style-primary"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/' ) ); ?>kontakty/">Оставить заявку</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></header>
<!-- /wp:group -->
