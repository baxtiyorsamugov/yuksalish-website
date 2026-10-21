# Публичные логотипы партнёров

Проверено 21.10.2026. Источник — [публичный каталог Yuksalish](https://yumh.uz/uz/partners) и ссылки главной страницы этого же сайта. Найдены 63 уникальных адреса изображений; доступны 62. Один исходник minjust возвращает HTTP-ошибку. Изображения без уверенно определённого названия или без реальной внешней ссылки не добавлены. Итог — 29 организаций вместо 6 (23 добавлены). Это перенос опубликованного списка, а не подтверждение текущего статуса сотрудничества.

Прямой доступ к архивной базе legacy_reference в этой итерации отсутствовал: локальный Docker daemon не запущен, LAN-стенд 192.168.0.140:8089 недоступен. База, архив и персональные данные не изменялись.

## Подготовка

Подготовленные SVG в app/public/assets/images/partners/ встраивают исходные байты изображений; они сохранены для происхождения и совместимости. В интерфейсе используются их lossless PNG-экспорты с alpha, до 512×256 px: фильтры не рассчитываются браузером и не дают линий при hover. viewBox исключает пустые поля. Для непрозрачного белого фона применяется нативный SVG feColorMatrix, переводящий белую подложку в alpha; готовые прозрачные исходники используют свою alpha. Белые буквы OSCE и синее поле флага ЕС сохранены как часть знаков. Перерисовка и генерация логотипов не использовались. Первичные URL и метод подготовки записаны в app/src/data/assets.json. Старые файлы оставлены для совместимости адресов.

Каталог и главная используют одну коллекцию partners. Повтор ленты декоративный, исключён из фокуса и дерева доступности; базовая скорость 32 px/с с ускорением от скролла до ×4. Hover задержан на 250 мс и плавно тормозит движение, клавиатурный фокус останавливает его сразу. Reduced motion и скрытая вкладка учитываются автоматически; кнопок ручной паузы нет. Все исходные изображения строки загружаются заранее при приближении блока к viewport: дальние элементы не ждут горизонтального появления. При загрузке страницы логотипы не требуют внешней сети.

## Состав

- [United Nations](https://www.un.org/)
- [World Bank](http://www.worldbank.org/)
- [UNDP](http://www.uz.undp.org/)
- [USAID](https://www.usaid.gov/)
- [Development Strategy Center](https://strategy.uz/)
- [ACTED](https://www.acted.org/en/countries/uzbekistan/)
- [OSCE](https://www.osce.org/ruz)
- [European Union](https://eeas.europa.eu/delegations/uzbekistan_en)
- [El-yurt umidi Foundation](http://eyuf.uz/)
- [UK aid](https://www.ukaiddirect.org/)
- [Hisense](https://global.hisense.com/)
- [Huawei](https://www.huawei.com/uz/)
- [Regional Dialogue](https://www.regionaldialogue.org/)
- [PeaceNexus](https://peacenexus.org/)
- [Business Ombudsman of Uzbekistan](https://biznesvakil.uz/uz)
- [Institute of Initiatives](http://initiative.uz/)
- [Konrad Adenauer Stiftung](https://www.kas.de/)
- [UNICEF](https://www.unicef.org/)
- [ARGO](http://argonet.org/)
- [Korea Legislation Research Institute](https://www.klri.re.kr/)
- [Federation of Trade Unions of Kazakhstan](http://www.kzsouz.kz/)
- [Ombudsman of Uzbekistan](http://ombudsman.uz/)
- [Youth Union of Uzbekistan](http://yoshlarittifoqi.uz/)
- [National Association of Electronic Mass Media of Uzbekistan](http://www.naesmi.uz/)
- [British Embassy Tashkent](https://www.gov.uk/world/organisations/british-embassy-tashkent)
- [Republican Center for Spirituality and Enlightenment](http://www.manaviyat.uz/)
- [Shanghai University](http://en.shu.edu.cn/)
- [Chonnam National University](http://www.jnu.ac.kr/)
- [Elsevier](https://www.elsevier.com/)
