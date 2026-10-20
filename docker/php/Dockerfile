FROM php:8.4-apache

COPY yuksalish.conf /etc/apache2/conf-available/yuksalish.conf

RUN docker-php-ext-install pdo_mysql mysqli \
    && a2enmod rewrite \
    && a2enconf yuksalish
