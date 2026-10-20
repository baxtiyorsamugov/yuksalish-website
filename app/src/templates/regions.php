<?php if ($page === 'region'): $region=$regions[$id]; page_header($title,t('regional_contact')); ?>
<section class="region-detail"><span class="work-icon"><?= icon('map-pin') ?></span><h2><?= e(t('contact_region')) ?></h2><a class="contact-email" href="mailto:<?= e($region['email']) ?>"><?= e($region['email']) ?><?= icon('arrow-up-right') ?></a><p><?= e(t('source_only')) ?></p><?php source_link('hududiy'); ?></section>
<section class="content-section"><h2><?= e(t('region_materials')) ?></h2><div class="empty-state compact"><p><?= e(t('source_only')) ?></p><a class="text-link" href="<?= e(url('regions')) ?>"><?= e(t('regions')) ?><?= icon('arrow') ?></a></div></section>
<?php else: page_header(t('region_title'),t('region_text')); ?>
<div class="region-directory"><?php foreach ($regions as $slug=>$region): ?><a href="<?= e(url('region/'.$slug)) ?>"><?= icon('map-pin') ?><span><?= e($region['names'][['uz'=>0,'uzc'=>1,'ru'=>2,'en'=>3][$lang]]) ?></span><?= icon('arrow-up-right') ?></a><?php endforeach ?></div>
<?php endif ?>
