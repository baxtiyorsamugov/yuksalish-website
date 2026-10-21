<?php
$entry = prepare_article($repository->localized($item,$lang));
$isProject = $page === 'project_detail';
$back = $isProject ? 'projects' : ($page === 'events_detail' ? 'events' : 'news');
$allLabel = $back === 'projects' ? 'all_projects' : ($back === 'news' ? 'all_news' : 'events');
$contentLang = $languages[$entry['content_language']][1];
$hasContents = $entry['outline'] || count($entry['blocks']) > 6;
$category = category($entry);
?>
<article class="article <?= $isProject ? 'article-project' : 'article-editorial' ?>" id="article-top">
    <div class="article-utility">
        <a class="text-link" href="<?= e(url($back)) ?>"><?= icon('arrow','reverse') ?><?= e(t($back)) ?></a>
        <button class="share-button copy-link" aria-label="<?= e(t('share')) ?>" data-success="<?= e(t('copied')) ?>" data-error="<?= e(t('copy_failed')) ?>"><?= icon('link') ?><span><?= e(t('share_short')) ?></span></button>
    </div>
    <header class="article-hero<?= empty($entry['image']) ? ' without-cover' : '' ?>">
        <div class="article-header">
            <div class="article-meta">
                <?php if ($back !== 'events'): ?><a class="article-category" href="<?= e(url($back,null,['category'=>$category])) ?>"><?= e(t($category)) ?></a><?php else: ?><span class="article-category"><?= e(t('events')) ?></span><?php endif ?>
                <?php if (!empty($entry['date'])): ?><time datetime="<?= e($entry['date']) ?>"><?= e(date('d.m.Y',strtotime($entry['date']))) ?></time><?php endif ?>
                <span><?= e(sprintf(t('reading_time'),$entry['reading_minutes'])) ?></span>
            </div>
            <h1 lang="<?= e($contentLang) ?>"<?= preg_match_all('/./us',$entry['heading_title']) > 100 ? ' class="long-title"' : '' ?>><?= e($entry['heading_title']) ?></h1>
            <a class="article-read text-link" href="#article-text"><?= e(t('read_article')) ?><?= icon('arrow','down') ?></a>
        </div>
        <?php if ($isProject && !empty($entry['image'])): ?><figure class="article-cover"><img src="<?= e($entry['image']) ?>" alt="<?= e($entry['title']) ?>" width="1400" height="800" fetchpriority="high"></figure><?php endif ?>
    </header>
    <?php if ($isProject): ?>
        <dl class="project-facts">
            <div><dt><?= e(t('project_direction')) ?></dt><dd><a href="<?= e(url('projects',null,['category'=>$category])) ?>"><?= e(t($category)) ?><?= icon('arrow-up-right') ?></a></dd></div>
            <?php foreach (['project_period','project_audience'] as $fact): ?><?php if (!empty($entry[$fact])): ?><div><dt><?= e(t($fact)) ?></dt><dd lang="<?= e($contentLang) ?>"><?= e($entry[$fact]) ?></dd></div><?php endif ?><?php endforeach ?>
        </dl>
    <?php elseif (!empty($entry['image'])): ?>
        <figure class="article-cover article-cover-editorial"><img src="<?= e($entry['image']) ?>" alt="<?= e($entry['title']) ?>" width="1400" height="800" fetchpriority="high"></figure>
    <?php endif ?>
    <?php if (!$entry['translated']): ?><p class="notice article-notice"><?= icon('globe') ?><?= e(t('translation_note')) ?></p><?php endif ?>
    <div class="article-layout">
        <aside class="article-aside">
            <?php if ($hasContents): ?>
                <details class="article-contents" open>
                    <summary><?= e(t('contents')) ?><?= icon('caret-down') ?></summary>
                    <nav aria-label="<?= e(t('contents')) ?>">
                        <a href="#article-text"><?= e(t('article_text')) ?></a>
                        <?php foreach ($entry['outline'] as $heading): ?><a href="#<?= e($heading['id']) ?>" lang="<?= e($contentLang) ?>"><?= e($heading['text']) ?></a><?php endforeach ?>
                        <a href="#article-source"><?= e(t('source')) ?></a>
                    </nav>
                </details>
            <?php endif ?>
            <a class="article-aside-source" href="<?= e($entry['source']) ?>" target="_blank" rel="noopener"><span><?= icon('link') ?><span><?= e(t('source')) ?><small>yumh.uz</small></span></span><?= icon('arrow-up-right') ?></a>
        </aside>
        <div class="article-reading">
            <div class="article-body" id="article-text" tabindex="-1" lang="<?= e($contentLang) ?>">
                <?php foreach ($entry['body_blocks'] as $block): ?>
                    <?php if ($block['type']==='heading'): ?><h2 id="<?= e($block['id']) ?>" tabindex="-1"><?= e($block['text']) ?></h2>
                    <?php elseif ($block['type']==='list'): ?><ul><?php foreach ($block['items'] as $text): ?><li><?= e($text) ?></li><?php endforeach ?></ul>
                    <?php else: ?><p><?= e($block['text']) ?></p><?php endif ?>
                <?php endforeach ?>
            </div>
            <footer class="article-source" id="article-source" tabindex="-1">
                <a href="<?= e($entry['source']) ?>" target="_blank" rel="noopener"><span><?= icon('link') ?><span><?= e(t('source')) ?><strong>Yuksalish · yumh.uz</strong></span></span><?= icon('arrow-up-right') ?></a>
            </footer>
            <div class="article-reading-footer">
                <button class="share-button copy-link" data-success="<?= e(t('copied')) ?>" data-error="<?= e(t('copy_failed')) ?>"><?= icon('link') ?><?= e(t('share')) ?></button>
            </div>
        </div>
    </div>
</article>
<?php if ($back !== 'events'): ?>
    <?php $related = array_values(array_filter($repository->all($back),fn($row)=>$row['id']!==$entry['id'])); ?>
    <?php if ($related): ?><section class="content-section related-section" aria-labelledby="related-title">
        <div class="related-heading"><div><span class="eyebrow"><?= e(t('continue_reading')) ?></span><h2 id="related-title"><?= e(t($isProject ? 'other_projects' : 'related')) ?></h2></div><a class="text-link" href="<?= e(url($back)) ?>"><?= e(t($allLabel)) ?><?= icon('arrow') ?></a></div>
        <div class="related-grid"><?php foreach (array_slice($related,0,3) as $row) card($row); ?></div>
    </section><?php endif ?>
<?php endif ?>
