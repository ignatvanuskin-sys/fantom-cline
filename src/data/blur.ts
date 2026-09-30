/**
 * Размытые превью кадров — 24px по ширине, около половины килобайта каждое.
 *
 * Зачем: next/image не готовит blur автоматически, если src — строка, а не
 * импорт модуля. Без превью карточка квеста в мобильной карусели показывала
 * пустое тёмное место, пока грузился кадр, — на свайпе это читалось как
 * «картинки нет». Теперь на её месте сразу проявляется сам кадр, размытый.
 *
 * Сгенерировано из public/media одним прогоном sharp — при замене фотографий
 * файл нужно перегенерировать.
 */
export const BLUR: Record<string, string> = {
  "/media/hero-corridor.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAIBAwb/xAAcEAACAgMBAQAAAAAAAAAAAAABAgARITFhE1H/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AM2ACu9CLmuXUlCLycS4+IWgp+3cilZQFPIRWfdaMIH/2Q==",
  "/media/room-attic.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAECAwb/xAAdEAACAgIDAQAAAAAAAAAAAAABAgADESExQVGB/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AM0NmPvAjQheGlqtQOVYt7nEBXUpXQrF82E7XwQkLCjbBb6YQP/Z",
  "/media/room-basement.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAECAwb/xAAfEAACAgIBBQAAAAAAAAAAAAABAgARAyFxEzFBQlH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABURAQEAAAAAAAAAAAAAAAAAAAAB/9oADAMBAAIRAxEAPwDmFq9zRFR8poUvgXFj6fst8d5ThUYgKVo/ZKsQ6gXzCJjZO4QP/9k=",
  "/media/room-foyer.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAECAwb/xAAeEAACAgEFAQAAAAAAAAAAAAAAEQECEgMhMUFxIv/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A5mIfAuuC9Orf0i8aJZ7+EGVK5SnEegO0LtgB/9k=",
  "/media/room-sanatorium.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAEDBAX/xAAgEAABBAICAwEAAAAAAAAAAAABAAIDERIxEyEUMkGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEQMRAD8A40bGmdxdrI/qtOY/A42++ROvlrHzUSRdk/DSeT5YjmTQ0e1IIubSE3NrZ7QqP//Z",
  "/media/room-ward-13.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQb/xAAeEAACAgIDAQEAAAAAAAAAAAABAgADEjERIVETgf/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFxEBAAMAAAAAAAAAAAAAAAAAAAERQf/aAAwDAQACEQMRAD8A55qyUyA6A7MmFE1bSN9jyMtf0Owv7BU1hmesUYLWMjtjuEmyMOeDkPYRS//Z",
  "/media/room-wardrobe.jpg":
    "data:image/jpeg;base64,/9j/2wBDABkRExYTEBkWFBYcGxkeJT4pJSIiJUw3Oi0+WlBfXllQV1ZkcJB6ZGqIbFZXfap+iJSZoaKhYXiwva+cu5CeoZr/2wBDARscHCUhJUkpKUmaZ1dnmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampr/wAARCAAQABgDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAwACBf/EAB8QAAEEAgIDAAAAAAAAAAAAAAEAAgMREjEhoSIyQf/EABQBAQAAAAAAAAAAAAAAAAAAAAL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAATH/2gAMAwEAAhEDEQA/AOHNHFHK+Njg9o9XVVo8Wl5s647R5l1a4TCEEWHdI4Wjd4n4QpZkFE6UlBr/2Q==",
};
