# convertToCustomUI 將 HTML 元素轉換成自訂元素

## 使用方法

範例：

```js
// 範例1：將 .customSelect 的 select 元素轉換為自訂下拉選單
convertToCustomUI({
  selector: '.customSelect',
  customUiOptionsFn: (element) => Array.from(element.options),
  customUiFn: dropMenu,
});

// 範例2：將 label文字為 '使用自訂傳入的select:' 下面的select元素轉換為自訂的下拉選單
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

convertToCustomUI 執行後會返回一個函數，用於將自訂 UI 刪除並回覆原本的 UI。不用參數沒有返回值。

> 如果自訂 UI 裡有包含會被 form 提交的元素的時候，例如具有 name 屬性的表單元素，需要特別注意，因為這些元素會被 form 收集。

---

範例 3：convertToCustomUI 的實際應用場景

有一個使用 div 組成的表格，使用這個函數可以把用戶點擊的 div 變成 input。

```js
// 清理管理器
const getCleanupManager = () => ({
  //清理函式數組
  fns: [],
  //將fns裡的函式執行並清空數組
  runCleanup() {
    this.fns.forEach((fn) => fn());
    this.fns.length = 0;
  },
});

// 使用很多 div 建立一個表格 並使用 convertToCustomUI 函數將點擊到的 div 元素轉換成input
// 先建立一個清理工具
const cleanupManager = getCleanupManager();
document.addEventListener('click', (event) => {
  // 有這個屬性代表是被convertToCustomUI替換過的UI
  // 代表重複點擊同一個元素
  if (event.target.dataset.originalElement) return;

  // 點擊的不是同一個元素的話就清理自訂UI
  cleanupManager.runCleanup();

  // 獲取目標表格
  const gridContainer = document.querySelector('#table');
  // 如果點擊到表格外面就清理自訂UI並就返回
  if (!gridContainer.contains(event.target)) return;

  // 執行 convertToCustomUI 把div轉換成input
  // 返回的函式可以用來清理自訂UI
  const cleanFn = convertToCustomUI({
    // 目標是被點擊的元素
    selector: event.target,
    customUiFn: (element) => {
      const input = document.createElement('input');
      // 將 div 裡的內容給 input
      input.value = element.textContent;
      // 當用戶輸入的時候把值給原本的div
      input.onchange = () => {
        element.textContent = input.value;
      };
      input.classList.add('grid-item');
      return input;
    },
  });
  // 將清除函數給manager
  cleanupManager.fns.push(cleanFn);
});
```

---

## 2025-02-08 更新第四版

新增了一個返回值，這個返回值可以將自訂 UI 清理並回覆舊的 UI。
新增了一個範例，示範如何使用清理函數。
加入 getCleanupManager 管理清理函數的工具。

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
