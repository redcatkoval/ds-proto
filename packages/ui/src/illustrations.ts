// Места для иллюстраций, которые знает система. Картинки к ним — у бренда:
// system/brands/<id>/illustrations/<место>.png. Нет картинки у бренда — компонент
// показывает иконку, и это нормальное состояние, а не ошибка.

export const illustrationSlots = {
  "empty-orders": "Пустой список заказов",
  "empty-products": "Пустой список товаров",
  "empty-stock": "На складе пусто",
  "no-results": "Поиск ничего не нашёл",
  "no-images": "У записи нет изображений",
  "welcome": "Первый вход",
  "all-set": "Настройка завершена",
  "load-failed": "Данные не загрузились",
} as const;

export type IllustrationName = keyof typeof illustrationSlots;
export const illustrationNames = Object.keys(illustrationSlots) as IllustrationName[];
