<section class="hero container" aria-labelledby="hero-title">
    <div class="hero-light" aria-hidden="true"></div>
    <div class="hero-sculpture" aria-hidden="true">
        <div class="y-monogram">
            <span class="y-shadow"><span class="y-surface"></span></span>
            <span class="y-surface y-depth y-depth-6"></span>
            <span class="y-surface y-depth y-depth-5"></span>
            <span class="y-surface y-depth y-depth-4"></span>
            <span class="y-surface y-depth y-depth-3"></span>
            <span class="y-surface y-depth y-depth-2"></span>
            <span class="y-surface y-depth y-depth-1"></span>
            <span class="y-surface y-face"></span>
        </div>
    </div>
    <div class="hero-content">
        <p class="hero-label"><span class="hero-dot" aria-hidden="true"></span><?= e(t('hero_label')) ?></p>
        <h1 id="hero-title"><span><?= e(t('hero_line1')) ?></span><span class="hero-accent"><?= e(t('hero_line2')) ?></span></h1>
        <p class="hero-description"><?= e(t('hero_text')) ?></p>
        <div class="hero-actions"><a class="button" href="<?= e(url('projects')) ?>"><?= e(t('our_projects')) ?><?= icon('arrow-up-right') ?></a><a class="text-link" href="<?= e(url('about')) ?>"><?= e(t('about')) ?><?= icon('arrow') ?></a></div>
    </div>
    <div class="hero-bottom"><a href="#results-title" class="home-explore"><?= e(t('explore_movement')) ?><?= icon('arrow','down') ?></a></div>
</section>
<section class="results container" aria-labelledby="results-title">
    <div class="results-intro"><h2 id="results-title"><?= e(t('results')) ?></h2><a href="https://yumh.uz" target="_blank" rel="noopener"><?= e(t('snapshot')) ?></a></div>
    <div class="stat"><strong>2019</strong><span><?= e(t('founded')) ?></span></div>
    <div class="stat"><strong>14</strong><span><?= e(t('regional_offices')) ?></span></div>
    <div class="stat"><strong>25</strong><span><?= e(t('projects_stat')) ?></span></div>
</section>
<section class="section container" aria-labelledby="work-title">
    <div class="section-heading"><h2 id="work-title"><?= e(t('work_title')) ?></h2><p><?= e(t('work_text')) ?></p></div>
    <div class="work-grid">
        <?php foreach (['dialogue'=>['chats','councils'], 'civic'=>['users','activity'], 'research'=>['compass','news']] as $key=>[$glyph,$route]): ?>
        <a class="work-card work-<?= e($key) ?>" href="<?= e(url($route)) ?>"><span class="work-icon"><?= icon($glyph) ?></span><h3><?= e(t($key)) ?></h3><p><?= e(t($key.'_text')) ?></p><span class="circle-arrow"><?= icon('arrow-up-right') ?></span></a>
        <?php endforeach ?>
    </div>
</section>
<section class="section projects-section" aria-labelledby="projects-title"><div class="container">
    <div class="section-heading"><h2 id="projects-title"><?= e(t('featured')) ?></h2><p><?= e(t('featured_text')) ?></p></div>
    <div class="projects-grid"><?php foreach ($repository->all('projects') as $index=>$project) card($project, $index === 0); ?></div>
    <div class="section-end"><a class="text-link" href="<?= e(url('projects')) ?>"><?= e(t('all_projects')) ?><?= icon('arrow') ?></a></div>
</div></section>
<section class="section container" aria-labelledby="news-title">
    <div class="section-heading"><h2 id="news-title"><?= e(t('latest')) ?></h2></div>
    <div class="news-grid home-news-grid"><?php foreach (array_slice($repository->all('news'),0,3) as $news) card($news); ?></div>
    <div class="section-end"><a class="text-link" href="<?= e(url('news')) ?>"><?= e(t('all_news')) ?><?= icon('arrow') ?></a></div>
</section>
<section class="section container" aria-labelledby="regions-title">
    <div class="region-panel"><div class="region-copy"><h2 id="regions-title"><?= e(t('region_title')) ?></h2><p><?= e(t('region_text')) ?></p><a class="button button-secondary" href="<?= e(url('regions')) ?>"><?= e(t('find_region')) ?><?= icon('arrow-up-right') ?></a></div><div class="region-visual" aria-hidden="true"><span class="region-number">14</span><span class="region-number-caption"><?= e(t('regional_offices')) ?></span></div></div>
</section>
<section class="partners-section container" aria-labelledby="partners-title">
    <div class="partners-heading"><div><p class="section-eyebrow"><?= e(t('partners')) ?></p><h2 id="partners-title"><?= e(t('partners_title')) ?></h2></div><a class="text-link" href="<?= e(url('partners')) ?>"><?= e(t('all_partners')) ?><?= icon('arrow-up-right') ?></a></div>
    <div class="partner-strip">
        <div class="partner-window" aria-label="<?= e(t('partners')) ?>">
            <div class="partner-track"><div class="partner-group">
                <?php foreach ($repository->all('partners') as $partner): ?><a href="<?= e($partner['url']) ?>" target="_blank" rel="noopener"><img src="<?= e($partner['image']) ?>" alt="<?= e($partner['name']) ?>" width="160" height="80" loading="lazy"></a><?php endforeach ?>
            </div></div>
        </div>
        <div class="partners-bottom"><span><?= e(t('partners_caption')) ?></span></div>
    </div>
</section>
