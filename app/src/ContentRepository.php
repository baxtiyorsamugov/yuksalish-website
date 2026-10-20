<?php
declare(strict_types=1);
final class ContentRepository
{
    private array $data;
    public function __construct(string $path)
    {
        $content = @file_get_contents($path);
        if ($content === false) throw new RuntimeException('Content file unavailable');
        $this->data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
    }
    public function all(string $collection): array { return $this->data[$collection] ?? []; }
    public function find(string $collection, string $id): ?array
    {
        foreach ($this->all($collection) as $item) {
            if ((string) ($item['id'] ?? '') === $id) return $item;
        }
        return null;
    }
    public function localized(array $item, string $language): array
    {
        $translations = $item['translations'];
        $source = isset($translations[$language]) ? $language : (isset($translations['uz']) ? 'uz' : array_key_first($translations));
        return array_merge($item, $translations[$source], ['content_language'=>$source, 'translated'=>$source === $language]);
    }
}
