<!doctype html>
<html class="no-js" lang="<?= e($languages[$lang][1]) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f7f9fc">
    <title><?= e($title) ?> | Yuksalish</title>
    <meta name="description" content="<?= e(preg_replace('/\s+/u', ' ', $description)) ?>">
    <meta property="og:title" content="<?= e($title) ?>">
    <meta property="og:description" content="<?= e(preg_replace('/\s+/u', ' ', $description)) ?>">
    <meta property="og:type" content="<?= $item ? 'article' : 'website' ?>">
    <meta property="og:image" content="/assets/images/project-47.webp">
    <?php if (in_array($page, ['404','error'], true)): ?><meta name="robots" content="noindex"><?php endif ?>
    <?php foreach ($languages as $code=>$language): ?><link rel="alternate" hreflang="<?= e($language[1]) ?>" href="<?= e(current_url($code)) ?>"><?php endforeach ?>
    <link rel="icon" type="image/svg+xml" href="/assets/images/yuksalish-logo.svg">
    <link rel="preload" as="font" type="font/ttf" href="/assets/fonts/manrope-400.ttf" crossorigin>
    <link rel="stylesheet" href="/assets/site.css">
    <link rel="stylesheet" href="/assets/uzbek-glyphs.css">
    <script src="/assets/site.js" defer></script>
</head>
<body class="page-<?= e($page) ?>">
<a class="skip-link" href="#main"><?= e(t('skip')) ?></a>
<header class="site-header">
    <div class="header-inner">
        <a class="brand" href="<?= e(url()) ?>" aria-label="<?= e(t('home')) ?>"><img src="/assets/images/yuksalish-logo.svg" width="145" height="46" alt="Yuksalish"></a>
        <button class="menu-toggle" aria-label="<?= e(t('menu')) ?>" aria-controls="site-navigation" aria-expanded="false"><?= icon('list') ?><span><?= e(t('menu')) ?></span></button>
        <nav class="main-nav" id="site-navigation" aria-label="<?= e(t('menu')) ?>">
            <?php
            $groups = ['about'=>['about','mission','structure','team','reports'], 'activity'=>['activity','councils','events'], 'projects'=>['projects','partners'], 'media'=>['news','experts','library','newsletter'], 'regions'=>['regions','contacts']];
            foreach ($groups as $label=>$links):
                $active = in_array($page, $links, true) || ($label === 'media' && in_array($page,['news_detail','experts_detail'],true)) || ($label === 'projects' && $page === 'project_detail') || ($label === 'regions' && $page === 'region');
            ?>
            <details class="nav-group<?= $active ? ' is-active' : '' ?>">
                <summary><?= e(t($label)) ?><?= icon('caret-down') ?></summary>
                <div class="nav-dropdown"><?php foreach ($links as $link): ?><a href="<?= e(url($link)) ?>"<?= $page === $link ? ' aria-current="page"' : '' ?>><?= e(t($link)) ?><?= icon('arrow-up-right') ?></a><?php endforeach ?></div>
            </details>
            <?php endforeach ?>
            <a class="mobile-contact" href="<?= e(url('contacts')) ?>"><?= e(t('contacts')) ?></a>
        </nav>
        <div class="header-actions">
            <details class="language-switch">
                <summary aria-label="<?= e(t('language')) ?>"><?= strtoupper(e($lang === 'uzc' ? 'ўз' : $lang)) ?><?= icon('caret-down') ?></summary>
                <div class="language-options"><?php foreach ($languages as $code=>$language): ?><a href="<?= e(current_url($code)) ?>" lang="<?= e($language[1]) ?>" hreflang="<?= e($language[1]) ?>"<?= $code === $lang ? ' aria-current="true"' : '' ?>><?= e($language[0]) ?></a><?php endforeach ?></div>
            </details>
            <a class="button button-small" href="<?= e(url('join')) ?>"><?= e(t('join')) ?><?= icon('arrow-up-right') ?></a>
        </div>
    </div>
</header>
<main id="main" tabindex="-1">
<?php if ($page === 'home'): require __DIR__.'/home.php'; else: ?>
    <div class="container inner-page">
        <nav class="breadcrumbs" aria-label="<?= e(t('back')) ?>"><a href="<?= e(url()) ?>"><?= e(t('home')) ?></a><span aria-hidden="true">/</span><span><?= e($title) ?></span></nav>
        <?php require __DIR__.'/pages.php'; ?>
    </div>
<?php endif ?>
</main>
<footer class="site-footer container">
    <div class="footer-main">
        <div class="footer-brand"><a href="<?= e(url()) ?>"><img src="/assets/images/yuksalish-logo.svg" width="156" height="52" alt="Yuksalish"></a><p><?= e(t('hero_label')) ?></p></div>
        <div class="footer-links"><?php foreach (['about','projects','news','regions','join','contacts'] as $link): ?><a href="<?= e(url($link)) ?>"><?= e(t($link)) ?></a><?php endforeach ?></div>
        <div class="footer-contacts"><a href="mailto:info@yumh.uz">info@yumh.uz <?= icon('arrow-up-right') ?></a><a href="tel:+998952303323">+998 95 230 33 23</a><p><?= e(t('address')) ?></p></div>
    </div>
    <div class="footer-bottom"><span>© <?= date('Y') ?> Yuksalish. <?= e(t('rights')) ?></span><div><a href="https://t.me/uzbyuksalish" target="_blank" rel="noopener">Telegram <?= icon('arrow-up-right') ?></a><a href="https://facebook.com/uzbyuksalish" target="_blank" rel="noopener">Facebook <?= icon('arrow-up-right') ?></a></div></div>
</footer>
<div class="toast" role="status" aria-live="polite"></div>
</body>
</html>
