<?php
/**
 * Вывод блока «Форма заявки».
 *
 * @var array $attributes Атрибуты блока.
 * @package konstanta
 */

defined( 'ABSPATH' ) || exit;

// phpcs:ignore WordPress.Security.NonceVerification -- только статус после редиректа.
$status = isset( $_GET['zayavka'] ) ? sanitize_key( $_GET['zayavka'] ) : '';
$uid    = wp_unique_id( 'kf-' );
$class  = 'form reveal' . ( 'ok' === $status ? ' is-sent' : '' );
$wrap   = get_block_wrapper_attributes( array( 'class' => $class ) );
$priv   = get_privacy_policy_url();
if ( ! $priv ) {
	$priv = konstanta_page_url( 'privacy' );
}
?>
<form <?php echo $wrap; // phpcs:ignore WordPress.Security.EscapeOutput ?> method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-contact-form novalidate>
	<h2><?php echo esc_html( $attributes['title'] ); ?></h2>
	<?php if ( $attributes['lead'] ) : ?>
		<p class="form-lead"><?php echo esc_html( $attributes['lead'] ); ?></p>
	<?php endif; ?>
	<div class="form-success" role="status"><?php echo esc_html( $attributes['successText'] ); ?></div>
	<?php if ( 'invalid' === $status || 'expired' === $status ) : ?>
		<p class="form-alert" role="alert"><?php echo 'expired' === $status ? 'Страница устарела — обновите её и отправьте заявку ещё раз.' : 'Проверьте заполнение полей и отправьте заявку ещё раз.'; ?></p>
	<?php endif; ?>
	<div class="form-fields">
		<input type="hidden" name="action" value="konstanta_request">
		<?php wp_nonce_field( 'konstanta_request', 'konstanta_nonce', false ); ?>
		<div class="form-hp" aria-hidden="true"><label>Сайт <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
		<div class="form-row">
			<label for="<?php echo esc_attr( $uid ); ?>-name">Имя</label>
			<input id="<?php echo esc_attr( $uid ); ?>-name" name="name" type="text" autocomplete="name" required>
			<span class="form-error">Укажите имя</span>
		</div>
		<div class="form-row">
			<label for="<?php echo esc_attr( $uid ); ?>-phone">Телефон</label>
			<input id="<?php echo esc_attr( $uid ); ?>-phone" name="phone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required>
			<span class="form-error">Укажите корректный телефон</span>
		</div>
		<?php if ( $attributes['showEmail'] ) : ?>
		<div class="form-row">
			<label for="<?php echo esc_attr( $uid ); ?>-email">Email</label>
			<input id="<?php echo esc_attr( $uid ); ?>-email" name="email" type="email" autocomplete="email" required>
			<span class="form-error">Укажите корректный email</span>
		</div>
		<?php endif; ?>
		<?php if ( $attributes['showBranch'] ) : ?>
		<div class="form-row">
			<label for="<?php echo esc_attr( $uid ); ?>-branch">Отделение</label>
			<select id="<?php echo esc_attr( $uid ); ?>-branch" name="branch">
				<option value="">Не выбрано</option>
				<?php foreach ( konstanta_get_branches() as $b ) : ?>
					<option><?php echo esc_html( $b['name'] ); ?></option>
				<?php endforeach; ?>
			</select>
		</div>
		<?php endif; ?>
		<div class="form-row">
			<label for="<?php echo esc_attr( $uid ); ?>-message">Сообщение</label>
			<textarea id="<?php echo esc_attr( $uid ); ?>-message" name="message" placeholder="<?php echo esc_attr( $attributes['messagePlaceholder'] ); ?>"></textarea>
		</div>
		<label class="form-check">
			<input type="checkbox" name="agree" value="1" required>
			<span>Согласен на обработку персональных данных согласно <a href="<?php echo esc_url( $priv ); ?>">политике</a></span>
		</label>
		<button class="btn btn-secondary" type="submit"><?php echo esc_html( $attributes['buttonText'] ); ?></button>
	</div>
</form>
