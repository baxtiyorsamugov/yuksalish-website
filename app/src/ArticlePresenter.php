<?php
declare(strict_types=1);

/** Prepare reading metadata and consecutive lists without changing source text. */
function prepare_article(array $entry): array
{
    $body = [];
    $outline = [];
    foreach ($entry['blocks'] as $index => $block) {
        if ($block['type'] === 'heading') {
            $block['id'] = 'part-'.$index;
            $outline[] = ['id'=>$block['id'], 'text'=>$block['text']];
        }
        if ($block['type'] === 'list') {
            $last = array_key_last($body);
            if ($last !== null && $body[$last]['type'] === 'list') {
                $body[$last]['items'][] = $block['text'];
                continue;
            }
            $block['items'] = [$block['text']];
        }
        $body[] = $block;
    }
    $words = preg_match_all('/[\p{L}\p{N}]+/u', implode(' ', array_column($entry['blocks'], 'text')));
    $entry['reading_minutes'] = max(1, (int)ceil($words / 180));
    $entry['heading_title'] = $entry['heading_title'] ?? $entry['title'];
    $entry['body_blocks'] = $body;
    $entry['outline'] = $outline;
    return $entry;
}
