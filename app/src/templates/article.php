<?php
$entry = $repository->localized($item,$lang);
$back = $page === 'project_detail' ? 'projects' : ($page === 'events_detail' ? 'events' : 'news');
$headings = array_filter($entry['blocks'], fn($block)=>$block['type']==='heading');
?>
<article class="article">
    <div class="article-header"><a class="text-link" href="<?= e(url($back)) ?>"><?= icon('arrow','reverse') ?><?= e(t($back)) ?></a><div class="card-meta"><span><?= e(t(category($entry))) ?></span><?php if (!empty($entry['date'])): ?><time datetime="<?= e($entry['date']) ?>"><?= e(date('d.m.Y',strtotime($entry['date']))) ?></time><?php endif ?></div><h1 lang="<?= e($languages[$entry['content_language']][1]) ?>"><?= e($entry['title']) ?></h1></div>
    <?php if (!$entry['translated']): ?><p class="notice"><?= icon('globe') ?><?= e(t('translation_note')) ?></p><?php endif ?>
    <?php if (!empty($entry['image'])): ?><div class="article-cover"><img src="<?= e($entry['image']) ?>" alt="<?= e($entry['title']) ?>" width="1400" height="800"></div><?php endif ?>
    <div class="article-layout">
        <aside class="article-aside"><?php if ($headings || count($entry['blocks']) > 6): ?><nav aria-label="<?= e(t('contents')) ?>"><h2><?= e(t('contents')) ?></h2><?php if (!$headings): ?><a href="#article-text"><?= e(t('article_text')) ?></a><?php endif ?><?php foreach ($headings as $index=>$heading): ?><a href="#part-<?= $index ?>" lang="<?= e($languages[$entry['content_language']][1]) ?>"><?= e($heading['text']) ?></a><?php endforeach ?><a href="#article-source"><?= e(t('source')) ?></a></nav><?php endif ?><button class="text-link copy-link" data-success="<?= e(t('copied')) ?>" data-error="<?= e(t('copy_failed')) ?>"><?= icon('link') ?><?= e(t('share')) ?></button></aside>
        <div class="article-body" id="article-text" lang="<?= e($languages[$entry['content_language']][1]) ?>"><?php foreach ($entry['blocks'] as $index=>$block): ?><?php if ($block['type']==='heading'): ?><h2 id="part-<?= $index ?>"><?= e($block['text']) ?></h2><?php elseif ($block['type']==='list'): ?><ul><li><?= e($block['text']) ?></li></ul><?php else: ?><p><?= e($block['text']) ?></p><?php endif ?><?php endforeach ?><a class="source-reference" id="article-source" href="<?= e($entry['source']) ?>" target="_blank" rel="noopener" lang="<?= e($languages[$lang][1]) ?>"><?= e(t('source')) ?>: Yuksalish <?= icon('arrow-up-right') ?></a></div>
    </div>
</article>
<?php if ($back !== 'events'): ?><section class="content-section"><h2><?= e(t('related')) ?></h2><div class="news-grid"><?php $related = array_values(array_filter($repository->all($back),fn($row)=>$row['id']!==$entry['id'])); foreach (array_slice($related,0,3) as $row) card($row); ?></div></section><?php endif ?>
