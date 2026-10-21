<?php
$headerGroups = [
    'about'=>['links'=>['about','mission','structure','team','reports'], 'icon'=>'users', 'intro'=>'nav_about_intro'],
    'activity'=>['links'=>['activity','councils','events'], 'icon'=>'compass', 'intro'=>'work_text'],
    'projects'=>['links'=>['projects','partners'], 'icon'=>'buildings', 'intro'=>'featured_text'],
    'media'=>['links'=>['news','experts','library','newsletter'], 'icon'=>'file-text', 'intro'=>'nav_media_intro'],
    'regions'=>['links'=>['regions','contacts'], 'icon'=>'map-pin', 'intro'=>'region_text'],
];
$headerIcons = ['about'=>'users','mission'=>'compass','structure'=>'buildings','team'=>'users','reports'=>'file-text','activity'=>'compass','councils'=>'chats','events'=>'globe','projects'=>'buildings','partners'=>'link','news'=>'file-text','experts'=>'users','library'=>'file-text','newsletter'=>'file-text','regions'=>'map-pin','contacts'=>'chats'];
?>
<header class="site-header">
    <div class="nav-scrim" aria-hidden="true" hidden></div>
    <div class="header-inner">
        <span class="header-progress" aria-hidden="true"></span>
        <a class="brand" href="<?= e(url()) ?>" aria-label="<?= e(t('home')) ?>"><img src="<?= e(asset('/assets/images/yuksalish-logo.png')) ?>" width="152" height="46" alt="Yuksalish"></a>
        <button class="menu-toggle" type="button" aria-label="<?= e(t('menu')) ?>" aria-controls="site-navigation" aria-expanded="false"><span class="menu-glyph" aria-hidden="true"><i></i><i></i></span><span><?= e(t('menu')) ?></span></button>
        <nav class="main-nav" id="site-navigation" aria-label="<?= e(t('menu')) ?>">
            <p class="nav-mobile-title"><?= e(t('navigation')) ?></p>
            <div class="nav-groups">
            <?php foreach ($headerGroups as $label=>$group):
                $links = $group['links'];
                $active = in_array($page, $links, true) || ($label === 'media' && in_array($page,['news_detail','experts_detail'],true)) || ($label === 'projects' && $page === 'project_detail') || ($label === 'regions' && $page === 'region') || ($label === 'activity' && $page === 'events_detail');
            ?>
            <div class="nav-item<?= $active ? ' is-active' : '' ?>">
                <button class="nav-toggle" type="button" aria-label="<?= e(t('section_menu').': '.t($label)) ?>" aria-controls="nav-<?= e($label) ?>" aria-expanded="false"><span class="nav-highlight" aria-hidden="true"></span><span><?= e(t($label)) ?></span><?= icon('caret-down') ?></button>
                <div class="nav-dropdown" id="nav-<?= e($label) ?>" hidden>
                    <div class="nav-menu-intro"><span class="nav-menu-symbol"><?= icon($group['icon']) ?></span><p class="nav-menu-title"><?= e(t($label)) ?></p><p><?= e(t($group['intro'])) ?></p></div>
                    <div class="nav-menu-links"><?php foreach ($links as $link): ?><a class="nav-entry" href="<?= e(url($link)) ?>"<?= $page === $link ? ' aria-current="page"' : '' ?>><span class="nav-entry-icon"><?= icon($headerIcons[$link]) ?></span><span><?= e(t($link)) ?></span><?= icon('arrow-up-right') ?></a><?php endforeach ?></div>
                </div>
                <noscript><details class="nav-fallback"><summary aria-label="<?= e(t('section_menu').': '.t($label)) ?>"><span><?= e(t($label)) ?></span><?= icon('caret-down') ?></summary><div class="nav-dropdown"><?php foreach ($links as $link): ?><a href="<?= e(url($link)) ?>"><?= e(t($link)) ?><?= icon('arrow-up-right') ?></a><?php endforeach ?></div></details></noscript>
            </div>
            <?php endforeach ?>
            </div>
            <div class="nav-mobile-footer"><a class="mobile-contact" href="<?= e(url('contacts')) ?>"><?= e(t('contacts')) ?><?= icon('arrow-up-right') ?></a><a class="nav-phone" href="tel:+998952303323">+998 95 230 33 23</a><a class="mobile-join button button-small" href="<?= e(url('join')) ?>"><?= e(t('join')) ?><?= icon('arrow-up-right') ?></a></div>
        </nav>
        <div class="header-actions">
            <a class="header-contact" href="<?= e(url('contacts')) ?>"><?= e(t('contacts')) ?></a>
            <details class="language-switch">
                <summary aria-label="<?= e(t('language')) ?>"><?= icon('globe') ?><span><?= $lang === 'uzc' ? 'ЎЗ' : e(strtoupper($lang)) ?></span><?= icon('caret-down') ?></summary>
                <div class="language-options"><p class="language-title"><?= e(t('language')) ?></p><?php foreach ($languages as $code=>$language): ?><a href="<?= e(current_url($code)) ?>" lang="<?= e($language[1]) ?>" hreflang="<?= e($language[1]) ?>"<?= $code === $lang ? ' aria-current="true"' : '' ?>><span><?= e($language[0]) ?></span><span class="language-code" aria-hidden="true"><?= $code === 'uzc' ? 'ЎЗ' : e(strtoupper($code)) ?></span></a><?php endforeach ?></div>
            </details>
            <a class="button button-small" href="<?= e(url('join')) ?>"><?= e(t('join')) ?><?= icon('arrow-up-right') ?></a>
        </div>
    </div>
</header>
