<?php
if (in_array($page, ['404','error'], true)) {
    require __DIR__.'/state.php';
} elseif (in_array($page, ['news_detail','project_detail','events_detail'], true)) {
    require __DIR__.'/article.php';
} elseif (in_array($page, ['projects','news'], true)) {
    require __DIR__.'/catalog.php';
} elseif (in_array($page, ['library','newsletter','reports'], true)) {
    require __DIR__.'/documents.php';
} elseif (in_array($page, ['regions','region'], true)) {
    require __DIR__.'/regions.php';
} elseif (in_array($page, ['team','experts','experts_detail'], true)) {
    require __DIR__.'/people.php';
} elseif ($page === 'contacts') {
    page_header(t('contacts'), t('join_text'));
    require __DIR__.'/contacts.php';
} elseif ($page === 'join') {
    page_header(t('join_title'), t('join_text'));
    ?>
    <div class="participation-grid"><?php foreach (['individuals','organizations'] as $audience): ?><section class="participation-card"><span class="work-icon"><?= icon($audience === 'individuals' ? 'users' : 'buildings') ?></span><h2><?= e(t($audience)) ?></h2><p><?= e(t($audience.'_text')) ?></p><a class="text-link" href="mailto:info@yumh.uz"><?= e(t('write')) ?><?= icon('arrow-up-right') ?></a></section><?php endforeach ?></div>
    <section class="content-section"><h2><?= e(t('contacts')) ?></h2><?php require __DIR__.'/contacts.php'; ?></section>
    <?php
} elseif ($page === 'partners') {
    page_header(t('partners_title'), t('organizations_text'));
    ?><div class="partner-directory"><?php foreach ($repository->all('partners') as $partner): ?><a href="<?= e($partner['url']) ?>" target="_blank" rel="noopener"><img src="<?= e($partner['image']) ?>" alt="<?= e($partner['name']) ?>" width="200" height="100"><span><?= e($partner['name']) ?><?= icon('arrow-up-right') ?></span></a><?php endforeach ?></div><?php
} elseif ($page === 'events') {
    page_header(t('events'), t('event_archive'));
    ?><div class="news-grid"><?php foreach ($repository->all('events') as $event) card($event); ?></div><?php
} else {
    require __DIR__.'/section.php';
}
