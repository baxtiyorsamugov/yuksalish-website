<?php
$collection = $page === 'projects' ? 'projects' : 'news';
$q = '';
if (is_string($_GET['q'] ?? null) && preg_match('/\A.{0,200}/us', $_GET['q'], $match)) $q = trim($match[0]);
$filter = is_string($_GET['category'] ?? null) ? $_GET['category'] : '';
$categories = $page === 'projects' ? ['education','environment','inclusion'] : ['news','analysis','announcements'];
if (!in_array($filter,$categories,true)) $filter = '';
$list = array_values(array_filter($repository->all($collection), function ($entry) use ($q, $filter, $repository, $lang) {
    $localized = $repository->localized($entry,$lang);
    return ($filter === '' || category($entry) === $filter) && ($q === '' || preg_match('/'.preg_quote($q,'/').'/iu', $localized['title'].' '.$localized['excerpt']));
}));
$totalPages = max(1, (int)ceil(count($list)/4));
$currentPage = max(1,min($totalPages,(int)(is_scalar($_GET['p'] ?? null) ? $_GET['p'] : 1)));
page_header(t($page), t($page === 'projects' ? 'featured_text' : 'work_text'));
?>
<form class="search-form" method="get" action="<?= e(url($page)) ?>"><label for="catalog-search" class="sr-only"><?= e(t('search')) ?></label><?= icon('magnifying-glass') ?><input id="catalog-search" type="search" name="q" value="<?= e($q) ?>" placeholder="<?= e(t('search_hint')) ?>" maxlength="200"><?php if ($filter): ?><input type="hidden" name="category" value="<?= e($filter) ?>"><?php endif ?><button class="button button-small" type="submit"><?= e(t('find')) ?></button></form>
<nav class="filter-tabs" aria-label="<?= e(t('search')) ?>"><?php foreach (array_merge([''],$categories) as $value): ?><a href="<?= e(url($page,null,array_filter(['q'=>$q,'category'=>$value]))) ?>"<?= $filter === $value ? ' aria-current="true"' : '' ?>><?= e(t($value === '' ? 'all' : $value)) ?></a><?php endforeach ?></nav>
<?php if (!$list): ?><div class="empty-state"><?= icon('magnifying-glass') ?><h2><?= e(t('empty_title')) ?></h2><p><?= e(t('empty_text')) ?></p><a class="text-link" href="<?= e(url($page)) ?>"><?= e(t('reset')) ?><?= icon('arrow') ?></a></div><?php else: ?>
<div class="catalog-grid"><?php foreach (array_slice($list,($currentPage-1)*4,4) as $entry) card($entry); ?></div>
<?php endif ?>
<?php if ($totalPages > 1): ?><nav class="pagination" aria-label="<?= e(t('pagination')) ?>"><?php if ($currentPage>1): ?><a href="<?= e(url($page,null,array_filter(['q'=>$q,'category'=>$filter,'p'=>$currentPage-1]))) ?>" aria-label="<?= e(t('previous')) ?>"><?= icon('arrow','reverse') ?></a><?php endif ?><?php for ($i=1;$i<=$totalPages;$i++): ?><a href="<?= e(url($page,null,array_filter(['q'=>$q,'category'=>$filter,'p'=>$i]))) ?>"<?= $i === $currentPage ? ' aria-current="page"' : '' ?>><?= $i ?></a><?php endfor ?><?php if ($currentPage<$totalPages): ?><a href="<?= e(url($page,null,array_filter(['q'=>$q,'category'=>$filter,'p'=>$currentPage+1]))) ?>" aria-label="<?= e(t('next')) ?>"><?= icon('arrow') ?></a><?php endif ?></nav><?php endif ?>
