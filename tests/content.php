<?php
declare(strict_types=1);
require __DIR__.'/../app/src/ContentRepository.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
$repository = new ContentRepository(__DIR__.'/../app/src/data/content.json');
$translations = require __DIR__.'/../app/src/translations.php';
foreach ($translations as $key=>$values) {
    check(count($values) === 4, 'Missing locale: '.$key);
    foreach ($values as $value) check(is_string($value) && $value !== '', 'Empty translation: '.$key);
}
$missing = $repository->find('news','nonexistent');
check($missing === null,'Unknown content must not resolve to an unrelated record');
$entry = $repository->find('news','936');
$localized = $repository->localized($entry,'en');
check(!$localized['translated'] && $localized['content_language'] === 'uz','Missing translation must be labelled');
check($repository->localized($repository->find('news','937'),'ru')['translated'],'Available translation must be used');
foreach (['news','projects','events'] as $collection) {
    foreach ($repository->all($collection) as $row) {
        check(count($row['translations']) > 0,'Content must have a real source translation');
        foreach ($row['translations'] as $translation) check(count($translation['blocks'])>0,'Article body must contain source text');
        check(str_starts_with($row['source'],'https://yumh.uz/'),'Content must retain source attribution');
        if ($row['image']) check(is_file(__DIR__.'/../app/public'.$row['image']),'Missing local image');
    }
}
foreach ($repository->all('documents') as $document) {
    check(file_get_contents(__DIR__.'/../app/public'.$document['url'],false,null,0,4)==='%PDF','Invalid PDF');
}
foreach ($repository->all('partners') as $partner) {
    check(filter_var($partner['url'], FILTER_VALIDATE_URL) !== false, 'Partner links must be real URLs');
    check($partner['source'] === 'https://yumh.uz/uz/partners', 'Partner must retain public provenance');
    check(is_file(__DIR__.'/../app/public'.$partner['image']), 'Missing local partner artwork');
}
try {
    new ContentRepository(__DIR__.'/missing-file.json');
    throw new RuntimeException('Missing content did not fail');
} catch (RuntimeException $error) {
    check($error->getMessage()==='Content file unavailable','Unexpected missing-content error');
}
echo "Content, translations, provenance, assets and failure handling passed.\n";
