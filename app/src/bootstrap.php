<?php
declare(strict_types=1);
require __DIR__ . '/ContentRepository.php';
require __DIR__ . '/ArticlePresenter.php';
$translations = require __DIR__ . '/translations.php';
$languages = ['uz'=>['O‘zbekcha','uz-Latn'], 'uzc'=>['Ўзбекча','uz-Cyrl'], 'ru'=>['Русский','ru'], 'en'=>['English','en']];
$path = trim(rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'), '/');
$segments = $path === '' ? [] : explode('/', $path);
$lang = isset($languages[$segments[0] ?? '']) ? array_shift($segments) : 'uz';
if ($path === '' && is_string($_GET['lang'] ?? null) && isset($languages[$_GET['lang']])) $lang = $_GET['lang'];
$page = $segments[0] ?? 'home';
$id = $segments[1] ?? null;
if (count($segments) > 2 || ($path !== '' && !preg_match('/^(uz|uzc|ru|en)(\/|$)/', $path))) $page = '404';
$aliases = ['project'=>'projects','hududiy'=>'regions','membership'=>'join','books'=>'library','audit'=>'reports','activities'=>'mission','jamoatchilik'=>'councils','csonewsletter'=>'newsletter','social2'=>'activity'];
if (isset($aliases[$page]) && $id === null) { header('Location: /'.$lang.'/'.$aliases[$page], true, 301); exit; }
function e(mixed $value): string { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function t(string $key): string {
    global $translations, $lang;
    return $translations[$key][['uz'=>0,'uzc'=>1,'ru'=>2,'en'=>3][$lang]] ?? $key;
}
function url(string $page='home', ?string $language=null, array $query=[]): string {
    global $lang;
    return '/'.($language ?? $lang).($page === 'home' ? '' : '/'.$page).($query ? '?'.http_build_query($query) : '');
}
function current_url(string $language): string {
    global $page, $id;
    return url($page.($id !== null ? '/'.$id : ''), $language, array_intersect_key($_GET, array_flip(['q','category','p'])));
}
function icon(string $name='arrow', string $class=''): string {
    return '<svg class="icon '.e($class).'" aria-hidden="true"><use href="/assets/icons/sprite.svg#'.e($name).'"></use></svg>';
}
function asset(string $path): string {
    $file = ($_SERVER['DOCUMENT_ROOT'] ?? '') . $path;
    return $path . (is_file($file) ? '?v=' . filemtime($file) : '');
}
function category(array $item): string {
    if ($item['kind'] === 'events') return 'events';
    if ($item['kind'] === 'project') return ['47'=>'education','46'=>'environment','45'=>'inclusion'][$item['id']] ?? 'projects';
    return match ($item['id']) { '938','934'=>'analysis', '936'=>'announcements', default=>'news' };
}
function card(array $item, bool $large=false): void {
    global $repository;
    $item = $repository->localized($item, $GLOBALS['lang']);
    $href = url($item['kind'].'_detail/'.$item['id']);
    require __DIR__.'/templates/card.php';
}
function page_header(string $title, string $description=''): void {
    echo '<header class="page-heading"><h1>'.e($title).'</h1>';
    if ($description !== '') echo '<p class="lead">'.e($description).'</p>';
    echo '</header>';
}
function source_link(string $path): void {
    global $lang;
    echo '<a class="button button-secondary" href="https://yumh.uz/'.e($lang.'/'.$path).'" target="_blank" rel="noopener">'.e(t('open_source')).icon('arrow-up-right').'</a>';
}
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
$detailCollections = ['news_detail'=>'news','project_detail'=>'projects','experts_detail'=>'experts','events_detail'=>'events'];
$validPages = ['home','about','mission','structure','team','reports','activity','projects','news','regions','region','join','partners','contacts','experts','events','library','newsletter','councils'];
$item = null;
$repository = null;
try {
    $repository = new ContentRepository(__DIR__.'/data/content.json');
    $regions = require __DIR__.'/data/regions.php';
    if (isset($detailCollections[$page])) {
        $item = $repository->find($detailCollections[$page], $id ?? '');
        if ($item === null) $page = '404';
    } elseif ($page === 'region') {
        if (!isset($regions[$id ?? ''])) $page = '404';
    } elseif (!in_array($page, $validPages, true) || $id !== null) $page = '404';
} catch (Throwable $error) {
    error_log('Public content could not be loaded: '.$error->getMessage());
    $page = 'error';
}
if ($page === '404') http_response_code(404);
if ($page === 'error') http_response_code(503);
$titleKey = match ($page) { 'home'=>'site','404'=>'not_found','error'=>'error_title',default=>$page };
$title = t($titleKey);
if ($item && isset($item['translations'])) $title = $repository->localized($item, $lang)['title'];
if ($item && isset($item['name'])) $title = $item['name'];
if ($page === 'region') $title = $regions[$id]['names'][['uz'=>0,'uzc'=>1,'ru'=>2,'en'=>3][$lang]];
$description = t('hero_text');
if ($item && isset($item['translations'])) $description = $repository->localized($item, $lang)['excerpt'];
require __DIR__.'/templates/layout.php';
