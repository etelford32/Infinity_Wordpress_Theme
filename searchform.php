<?php
/**
 * Search Form Template
 *
 * @package Infinity
 * @since 1.0.0
 */

$unique_id = wp_unique_id('search-form-');
?>

<form role="search" method="get" class="search-form" action="<?php echo esc_url(home_url('/')); ?>">
    <label for="<?php echo esc_attr($unique_id); ?>" class="sr-only">
        <?php esc_html_e('Search for:', 'infinity'); ?>
    </label>
    <div class="search-form-inner">
        <input
            type="search"
            id="<?php echo esc_attr($unique_id); ?>"
            class="search-field"
            placeholder="<?php esc_attr_e('Search simulations, blueprints...', 'infinity'); ?>"
            value="<?php echo get_search_query(); ?>"
            name="s"
        />
        <button type="submit" class="search-submit">
            <span class="sr-only"><?php esc_html_e('Search', 'infinity'); ?></span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    </div>
</form>

<style>
.search-form {
    width: 100%;
}

.search-form-inner {
    display: flex;
    gap: var(--spacing-sm);
    max-width: 500px;
    margin: 0 auto;
}

.search-field {
    flex: 1;
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-base);
    font-family: var(--font-family-primary);
    color: var(--color-text-primary);
    background-color: var(--color-bg-secondary);
    border: 2px solid var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-field:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.search-field::placeholder {
    color: var(--color-text-tertiary);
}

.search-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.search-submit:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
}

.search-submit:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
}
</style>
