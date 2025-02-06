# convertToCustomUI - 將 HTML 元素轉換成自訂元素

## 使用方法

範例：

```js
// 測試：將 .customSelect 的 select 元素轉換為自訂下拉選單
convertToCustomUI({
  selector: '.customSelect',
  customUiOptionsFn: (element) => Array.from(element.options),
  customUiFn: dropMenu,
});

// 測試：將 .title 的元素轉換為自訂的 h1 元素。
convertToCustomUI({
  selector: '.title',
  customUiFn: (element) => {
    const newH1 = document.createElement('h1');
    newH1.textContent = element.textContent;
    newH1.style.fontStyle = 'italic';
    newH1.style.fontWeight = 'bold';
    newH1.style.textDecoration = 'underline';
    return newH1;
  },
});

// 測試：將 label文字為 '使用自訂傳入的select:' 的下面的select元素轉換為自訂的下拉選單
convertToCustomUI({
  selector: Array.from(document.querySelectorAll('label')).find(
    (label) => label.textContent === '使用自訂傳入的select:'
  ).nextElementSibling,
  customUiOptionsFn: (element) => Array.from(element.options),
  customUiFn: dropMenu,
});
```

| 參數                | 預設                   | 說明                                                                     |
| ------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `selector`          | 必填                   | 可以填入 `class`、`id`、`tag`、DOM 元素、`NodeList` 或 `Element` 陣列。  |
| `customUiOptionsFn` | `(element) => element` | 接收 `selector` 找到的元素，返回要傳入 `customUiFn` 的參數。             |
| `customUiFn`        | 必填                   | 自訂的 UI 函式，接收由 customUiOptionsFn 返回的參數，回傳一個 DOM 元素。 |

> 如果自訂 UI 裡有包含會被 form 提交的元素的時候，例如具有 name 屬性的表單元素，需要特別注意，因為這些元素會被 form 收集。

---

## 2025-02-06 更新第三版

將 convertToCustomUI 的 selector 參數擴充成可以接收 CSS 選擇器、DOM 元素、NodeList 和 Element 陣列，優化成連 CSS 選擇器都不用加。

第三版主要更新的目的是讓使用這個函式的人可以把自己想要轉換的 DOM 元素傳入，提供除了 id、class 和 tag 以外的選擇。

---

## 2025-02-05 更新第二版

這個版本的方式是將 select 應藏，並插入客製化的 UI，
透過控制 option 的 selected 屬性，來達到選取的效果，
並且不限定 select 元素，可以對任何元素進行轉換。

> 回饋一：已經有一些現存的 html，上面可能有各種各樣的 select，希望您寫一段 code 可以把指定的 select 元件替換成比較好用的 UI。
> 實際使用上有可能並不希望把所有的 select 都轉換掉。

回答：這個版本透過選擇器指定要轉換的元素，所以不會轉換所有 select，也不會動到原本的 HTML 結構。

> 回饋二：要考慮到重複使用性
> 續 2., 您寫出來的東西很可能會需要給其他工程師使用，需要考慮重複使用性

回答：這個版本將程式碼運用注入的方式，將主要的函式和自訂 UI 解耦，並透過 customUiOptionsFn 函數控制要傳入自訂 UI 函數的參數。

```js
convertToCustomUI({
  selector: '.customSelect',
  customUiOptionsFn: (element) => Array.from(element.options),
  customUiFn: dropMenu,
});
```

selector：css 選擇器，把要套用 UI 的元素 id、class 或元素標籤傳進去。
customUiOptionsFn：接收一個選擇器找到的元素，返回要傳入 customUiFn 的參數。預設 (element) => element。
customUiFn：自訂的 UI 函式，這個函式要接受一個參數，參數由 customUiOptionsFn 決定，返回自訂 UI 元素。

convertToCustomUI 函式會使用 selector 找到目標元素並傳入 customUiOptionsFn。
customUiOptionsFn 接收目標元素，返回值會傳入 customUiFn。
customUiFn 的返回的元素會插入到目標元素下面。
目標元素會被隱藏。

如果要更改 UI 只要修改 customUiFn。
customUiOptionsFn 這個參數是為了讓 convertToCustomUI 這個函式可以兼容其他元素，而不侷限在 select 元素，
可以對元素進行處理再傳入 customUiFn。

convertToCustomUI 這個主要函數的工作是處理如何隱藏原本的元素，並且在隱藏的元素後面插入自訂的 UI。

> 回饋三：希望能盡可能減少程式碼的改動
> 以 submit button 為例，假設原本的 submit button 的功能是抓 select 的值做一些處理，套用新的 UI 後最好能夠不需要改動關於 submit button 的程式

這個版本不會讓 select 消除，而是將它隱藏，自訂 UI 會控制 option 的 selected 屬性，
在表單送出時，原本的 select 依然有效，可以將選取的值送出。
