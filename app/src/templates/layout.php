<!doctype html>
<html class="no-js" lang="<?= e($languages[$lang][1]) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#eef2f7">
    <title><?= e($title) ?> | Yuksalish</title>
    <meta name="description" content="<?= e(preg_replace('/\s+/u', ' ', $description)) ?>">
    <meta property="og:title" content="<?= e($title) ?>">
    <meta property="og:description" content="<?= e(preg_replace('/\s+/u', ' ', $description)) ?>">
    <meta property="og:type" content="<?= $item ? 'article' : 'website' ?>">
    <meta property="og:image" content="/assets/images/project-47.webp">
    <?php if (in_array($page, ['404','error'], true)): ?><meta name="robots" content="noindex"><?php endif ?>
    <?php foreach ($languages as $code=>$language): ?><link rel="alternate" hreflang="<?= e($language[1]) ?>" href="<?= e(current_url($code)) ?>"><?php endforeach ?>
    <link rel="icon" type="image/png" href="<?= e(asset('/assets/images/yuksalish-logo.png')) ?>">
    <link rel="preload" as="font" type="font/ttf" href="/assets/fonts/manrope-400.ttf" crossorigin>
    <link rel="preload" as="font" type="font/ttf" href="/assets/fonts/manrope-500.ttf" crossorigin>
    <link rel="stylesheet" href="<?= e(asset('/assets/site.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/vendor/lenis.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/footer.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/motion.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/navigation.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/surfaces.css')) ?>">
    <?php if ($page === 'home'): ?><link rel="stylesheet" href="<?= e(asset('/assets/home.css')) ?>"><?php endif ?>
    <link rel="stylesheet" href="<?= e(asset('/assets/experience.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/header.css')) ?>">
    <link rel="stylesheet" href="/assets/uzbek-glyphs.css">
    <script src="<?= e(asset('/assets/navigation.js')) ?>"></script>
    <script src="<?= e(asset('/assets/vendor/lenis.min.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/page-lifecycle.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/header.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/site.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/motion.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/experience.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/router.js')) ?>" defer></script>
</head>
<body class="page-<?= e($page) ?>">
<canvas class="ambient-waves" aria-hidden="true"></canvas>
<a class="skip-link" href="#main"><?= e(t('skip')) ?></a>
<?php require __DIR__.'/header.php'; ?>
<main id="main" tabindex="-1">
<?php if ($page === 'home'): require __DIR__.'/home.php'; else: ?>
    <div class="container inner-page">
        <?php
        $breadcrumbParent = ['news_detail'=>'news','project_detail'=>'projects','events_detail'=>'events','experts_detail'=>'experts','region'=>'regions'][$page] ?? null;
        $breadcrumbTitle = $item && isset($item['translations']) ? ($repository->localized($item,$lang)['display_title'] ?? $title) : $title;
        ?>
        <nav class="breadcrumbs" aria-label="<?= e(t('breadcrumb_label')) ?>"><a href="<?= e(url()) ?>"><?= e(t('home')) ?></a><span aria-hidden="true">/</span><?php if ($breadcrumbParent): ?><a href="<?= e(url($breadcrumbParent)) ?>"><?= e(t($breadcrumbParent)) ?></a><span aria-hidden="true">/</span><?php endif ?><span aria-current="page"><?= e($breadcrumbTitle) ?></span></nav>
        <?php require __DIR__.'/pages.php'; ?>
    </div>
<?php endif ?>
</main>
<footer class="site-footer container">
  <div class="footer-shell">
    <?php if ($page === 'home'): ?>
    <div class="footer-invitation">
        <h2><?= e(t('join_title')) ?></h2>
        <div><p><?= e(t('join_text')) ?></p><a class="button" href="<?= e(url('join')) ?>"><?= e(t('join')) ?><?= icon('arrow-up-right') ?></a></div>
    </div>
    <?php endif ?>
    <div class="footer-main">
        <div class="footer-brand"><a href="<?= e(url()) ?>"><img src="<?= e(asset('/assets/images/yuksalish-logo.png')) ?>" width="156" height="52" alt="Yuksalish"></a><p><?= e(t('hero_label')) ?></p></div>
        <nav class="footer-links" aria-label="<?= e(t('footer_navigation')) ?>"><?php foreach (['about','projects','news','regions','join','contacts'] as $link): ?><a href="<?= e(url($link)) ?>"><?= e(t($link)) ?><?= icon('arrow-up-right') ?></a><?php endforeach ?></nav>
        <div class="footer-contacts"><a href="mailto:info@yumh.uz">info@yumh.uz <?= icon('arrow-up-right') ?></a><a href="tel:+998952303323">+998 95 230 33 23</a><address><?= e(t('address')) ?></address></div>
    </div>
    <div class="footer-bottom"><span>© <?= date('Y') ?> Yuksalish. <?= e(t('rights')) ?></span><div><a href="https://t.me/uzbyuksalish" target="_blank" rel="noopener">Telegram <?= icon('arrow-up-right') ?></a><a href="https://facebook.com/uzbyuksalish" target="_blank" rel="noopener">Facebook <?= icon('arrow-up-right') ?></a></div></div>
  </div>
</footer>
<button class="back-to-top" type="button" aria-label="<?= e(t('page_top')) ?>" title="<?= e(t('page_top')) ?>" hidden><?= icon('arrow','up') ?></button>
<div class="toast" role="status" aria-live="polite"></div>
</body>
</html>
