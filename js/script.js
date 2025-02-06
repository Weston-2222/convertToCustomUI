/**
  這個版本的方式是將select應藏，並插入客製化的UI，
  透過控制option的selected屬性，來達到選取的效果，
  並且不限定 select 元素，可以對任何元素進行轉換。

  回饋一：已經有一些現存的html，上面可能有各種各樣的select，
  希望您寫一段code可以把指定的select元件替換成比較好用的UI。
  實際使用上有可能並不希望把所有的select都轉換掉。

  回答：這個版本透過選擇器指定要轉換的元素，所以不會轉換所有select，也不會動到原本的HTML結構。


  回饋二：要考慮到重複使用性
  續2., 您寫出來的東西很可能會需要給其他工程師使用，需要考慮重複使用性

  回答：這個版本將程式碼運用注入的方式，將主要的函式和自訂UI解耦，
  並透過customUiOptionsFn函數控制要傳入自訂UI函數的參數。

    convertToCustomUI({
      selector: ".customSelect",
      customUiOptionsFn: (element) => Array.from(element.options),
      customUiFn: dropMenu,
    });

    selector：css選擇器，把要套用UI的元素id、class或元素標籤傳進去。
    customUiOptionsFn：接收一個選擇器找到的元素，返回要傳入 customUiFn 的參數。預設 (element) => element。
    customUiFn：自訂的UI函式，這個函式要接受一個參數，參數由 customUiOptionsFn 決定，返回自訂UI元素。

    convertToCustomUI 函式會使用 selector 找到目標元素並傳入 customUiOptionsFn。
    customUiOptionsFn 接收目標元素，返回值會傳入customUiFn。
    customUiFn 的返回的元素會插入到目標元素下面。
    目標元素會被隱藏。

    如果要更改UI只要修改 customUiFn。
    customUiOptionsFn 這個參數是為了讓 convertToCustomUI 這個函式可以兼容其他元素，而不侷限在select元素，
    可以對元素進行處理再傳入 customUiFn。

    convertToCustomUI這個主要函數的工作是處理如何隱藏原本的元素，並且在隱藏的元素後面插入自訂的UI。


  回饋三：希望能盡可能減少程式碼的改動
  以submit button為例，假設原本的submit button的功能是抓select的值做一些處理，
  套用新的UI後最好能夠不需要改動關於submit button的程式

  這個版本不會讓select消除，而是將它隱藏，自訂UI會控制 option 的 selected 屬性，
  在表單送出時，原本的select依然有效，可以將選取的值送出。
*/

/*
 * 自訂的選單UI
 * @param {HTMLOptionElement[]} optionItems - 選項列表
 * @returns {Element} - 自訂選單的根元素
 */
const dropMenu = (optionItems) => {
  // 創建外層容器 dropMenu
  const dropMenu = document.createElement("div");
  dropMenu.classList.add("dropMenu");

  // 創建顯示已選項目的容器 chooses
  const chooses = document.createElement("div");
  chooses.classList.add("chooses");

  // 容納已選項目文字的區塊 chooses-content
  const choosesContent = document.createElement("div");
  choosesContent.classList.add("chooses-content");

  // 按鈕：點擊時用來切換選單顯示/隱藏
  const button = document.createElement("button");
  button.textContent = "選擇"; // 按鈕文字
  button.type = "button"; // 防止在表單內被當成 submit
  button.classList.add("toggle-button");

  // 容納所有選項 UI 的區塊 options
  const options = document.createElement("div");
  options.classList.add("options", "hidden");

  // 將子元素組合到結構中
  chooses.appendChild(choosesContent);
  chooses.appendChild(button);
  dropMenu.appendChild(chooses);
  dropMenu.appendChild(options);

  // 點擊按鈕時，切換顯示/隱藏選單
  button.onclick = (e) => {
    e.stopPropagation(); // 防止事件冒泡
    options.classList.toggle("hidden"); // 切換 hidden 樣式
  };

  // 為原本 select 中的每個 option 建立對應的自訂 UI
  optionItems.forEach((option) => {
    // 建立單個選項在自訂選單中的顯示元素
    const optionElement = document.createElement("div");
    optionElement.classList.add("option-item");
    optionElement.textContent = option.textContent;

    // 加到 options 容器中
    options.appendChild(optionElement);

    // 點擊該選項時，同步到原本的 select
    optionElement.onclick = () => {
      // 如果該選項已選取，則取消選取
      if (option.selected) {
        // 取消選取
        option.selected = false;
        // 從 choosesContent 中移除該選項
        // 在choosesContent中的optionElement是複製的，所以需要使用data-value來找到
        const selectedOption = choosesContent.querySelector(
          `[data-value="${option.value}"]`
        );
        if (selectedOption) choosesContent.removeChild(selectedOption);

        // 移除選取css
        optionElement.classList.remove("selected-item");
      } else {
        // 選取該選項
        option.selected = true;
        // 複製元素
        const clonedOption = optionElement.cloneNode(true);
        // 為複製的元素設置一個屬性 用來取消選取
        clonedOption.setAttribute("data-value", option.value);
        // 添加選取css
        clonedOption.classList.add("selected-item");

        // 確保新添加的 clone 也可以點擊取消
        clonedOption.onclick = () => {
          // 移除複製的元素
          choosesContent.removeChild(clonedOption);
          // 取消選取
          option.selected = false;
          // 移除選取css
          optionElement.classList.remove("selected-item");
        };
        // 添加到choosesContent
        choosesContent.appendChild(clonedOption);
      }
    };
  });

  // 點擊任何外部區域時，將選單隱藏
  document.addEventListener("click", (event) => {
    if (!dropMenu.contains(event.target)) {
      options.classList.add("hidden");
    }
  });

  return dropMenu;
};

/**
 * 將指定的元素隱藏，並插入客製化的 UI。
 * @param {Object} options - 配置選項。
 * @param {string} options.selector - CSS 選擇器，例如 ".customSelect"。
 * @param {Function} options.customUiOptionsFn - 接受一個選擇器找到的元素，返回要傳入customUiFn的參數。預設 (element) => element。
 * @param {Function} options.customUiFn - 自訂的 UI 函式。
 */
const convertToCustomUI = ({
  selector,
  customUiOptionsFn = (element) => element,
  customUiFn,
}) => {
  // 取得所有符合 selector 的元素
  document.querySelectorAll(selector).forEach((element) => {
    // 如果已有 data-converted 屬性代表已轉換過，則直接跳過避免重複轉換
    if (element.dataset.converted) return; // 避免重複轉換

    // 標示該元素已被轉換
    element.dataset.converted = "true";

    // 取得要傳入customUiFn的參數
    const params = customUiOptionsFn(element);
    const customUifn = customUiFn(params);

    // 隱藏原本的元素
    element.style.display = "none";
    // 將自訂選單插入到 DOM 結構中，放在原本的元素之後
    element.parentNode.insertBefore(customUifn, element.nextSibling);

    // 由於元素被隱藏，但並未被移除，
    // 因此在表單提交時，原本的元素仍然有效，可將選取的值送出。
  });
};

// 測試：將 .customSelect 的 select 元素轉換為自訂下拉選單
convertToCustomUI({
  selector: ".customSelect",
  customUiOptionsFn: (element) => Array.from(element.options),
  customUiFn: dropMenu,
});

// 測試：將 .title 的元素轉換為自訂的 h1 元素。
convertToCustomUI({
  selector: ".title",
  customUiFn: (element) => {
    const newH1 = document.createElement("h1");
    newH1.textContent = element.textContent;
    newH1.style.fontStyle = "italic";
    newH1.style.fontWeight = "bold";
    newH1.style.textDecoration = "underline";
    return newH1;
  },
});
