<article class="content-card<?= $large ? ' card-large' : '' ?>">
    <a class="card-image" href="<?= e($href) ?>" tabindex="-1" aria-hidden="true">
        <?php if (!empty($item['image'])): ?><img src="<?= e($item['image']) ?>" alt="" width="900" height="600" loading="lazy"><?php else: ?><div class="image-fallback" aria-hidden="true"><img src="/assets/images/yuksalish-logo.svg" alt="" width="145" height="46"></div><?php endif ?>
    </a>
    <div class="card-body">
        <div class="card-meta"><span><?= e(t(category($item))) ?></span><?php if (!empty($item['date'])): ?><time datetime="<?= e($item['date']) ?>"><?= e(date('d.m.Y', strtotime($item['date']))) ?></time><?php endif ?></div>
        <h3 lang="<?= e($GLOBALS['languages'][$item['content_language']][1]) ?>"><a href="<?= e($href) ?>"><?= e($item['display_title'] ?? $item['title']) ?></a></h3>
        <?php if ($large && $item['excerpt'] !== ''): ?><p lang="<?= e($GLOBALS['languages'][$item['content_language']][1]) ?>"><?= e($item['excerpt']) ?></p><?php endif ?>
        <a class="card-bottom" href="<?= e($href) ?>" tabindex="-1" aria-hidden="true"><span><?= e(t('read')) ?></span><?= icon('arrow-up-right') ?></a>
    </div>
</article>
