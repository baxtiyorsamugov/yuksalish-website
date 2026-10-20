<?php
$descriptionKey = match ($page) { 'about'=>'mission_text', 'mission'=>'mission_text', 'structure'=>'structure_text', 'councils'=>'councils_text', default=>'work_text' };
page_header(t($page), t($descriptionKey));
?>
<?php if (in_array($page,['about','mission'],true)): ?>
<div class="about-feature"><div class="about-year"><strong>2019</strong><span><?= e(t('history')) ?></span></div><div class="prose"><h2><?= e(t('history')) ?></h2><p><?= e(t('history_text')) ?></p><h2><?= e(t('mission')) ?></h2><p><?= e(t('mission_text')) ?></p><a class="source-reference" href="https://yumh.uz/<?= e($lang) ?>/about" target="_blank" rel="noopener"><?= e(t('source')) ?><?= icon('arrow-up-right') ?></a></div></div>
<nav class="section-links" aria-label="<?= e(t('about')) ?>"><?php foreach (['structure','team','reports','regions'] as $link): ?><a href="<?= e(url($link)) ?>"><?= e(t($link)) ?><?= icon('arrow-up-right') ?></a><?php endforeach ?></nav>
<?php elseif ($page === 'structure'): ?>
<div class="structure-layout"><a href="<?= e(url('team')) ?>" class="structure-central"><?= icon('buildings') ?><h2><?= e(t('central_office')) ?></h2><?= icon('arrow-up-right') ?></a><div class="structure-line" aria-hidden="true"></div><a class="structure-regional" href="<?= e(url('regions')) ?>"><strong>14</strong><h2><?= e(t('regional_offices')) ?></h2><?= icon('arrow-up-right') ?></a></div>
<?php elseif ($page === 'councils'): ?>
<div class="source-panel"><?= icon('chats') ?><h2><?= e(t('dialogue')) ?></h2><p><?= e(t('councils_text')) ?></p><?php source_link('jamoatchilik'); ?></div>
<?php else: ?>
<div class="activity-list"><?php foreach (['dialogue'=>['chats','councils'], 'civic'=>['users','projects'], 'research'=>['compass','experts']] as $key=>[$glyph,$link]): ?><section><span class="work-icon"><?= icon($glyph) ?></span><div><h2><?= e(t($key)) ?></h2><p><?= e(t($key.'_text')) ?></p><a class="text-link" href="<?= e(url($link)) ?>"><?= e(t($link)) ?><?= icon('arrow') ?></a></div></section><?php endforeach ?></div>
<?php endif ?>
