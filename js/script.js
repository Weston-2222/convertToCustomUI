/*
 * 自訂的選單UI
 * @param {HTMLOptionElement[]} optionItems - 選項列表
 * @returns {Element} - 自訂選單的根元素
 */
const dropMenu = (optionItems) => {
  // 創建外層容器 dropMenu
  const dropMenu = document.createElement('div');
  dropMenu.classList.add('dropMenu');

  // 創建顯示已選項目的容器 chooses
  const chooses = document.createElement('div');
  chooses.classList.add('chooses');

  // 容納已選項目文字的區塊 chooses-content
  const choosesContent = document.createElement('div');
  choosesContent.classList.add('chooses-content');

  // 按鈕：點擊時用來切換選單顯示/隱藏
  const button = document.createElement('button');
  button.textContent = '選擇'; // 按鈕文字
  button.type = 'button'; // 防止在表單內被當成 submit
  button.classList.add('toggle-button');

  // 容納所有選項 UI 的區塊 options
  const options = document.createElement('div');
  options.classList.add('options', 'hidden');

  // 將子元素組合到結構中
  chooses.appendChild(choosesContent);
  chooses.appendChild(button);
  dropMenu.appendChild(chooses);
  dropMenu.appendChild(options);

  // 點擊按鈕時，切換顯示/隱藏選單
  button.onclick = (e) => {
    e.stopPropagation(); // 防止事件冒泡
    options.classList.toggle('hidden'); // 切換 hidden 樣式
  };

  // 為原本 select 中的每個 option 建立對應的自訂 UI
  optionItems.forEach((option) => {
    // 建立單個選項在自訂選單中的顯示元素
    const optionElement = document.createElement('div');
    optionElement.classList.add('option-item');
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
        optionElement.classList.remove('selected-item');
      } else {
        // 選取該選項
        option.selected = true;
        // 複製元素
        const clonedOption = optionElement.cloneNode(true);
        // 為複製的元素設置一個屬性 用來取消選取
        clonedOption.setAttribute('data-value', option.value);
        // 添加選取css
        clonedOption.classList.add('selected-item');

        // 確保新添加的 clone 也可以點擊取消
        clonedOption.onclick = () => {
          // 移除複製的元素
          choosesContent.removeChild(clonedOption);
          // 取消選取
          option.selected = false;
          // 移除選取css
          optionElement.classList.remove('selected-item');
        };
        // 添加到choosesContent
        choosesContent.appendChild(clonedOption);
      }
    };
  });

  // 點擊任何外部區域時，將選單隱藏
  document.addEventListener('click', (event) => {
    if (!dropMenu.contains(event.target)) {
      options.classList.add('hidden');
    }
  });

  return dropMenu;
};

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

/**
 * 將指定的元素隱藏，並插入客製化的 UI。
 * @param {Object} options - 配置選項。
 * @param {string} options.selector - 可以填入CSS 選擇器，DOM元素，NodeList，Element陣列。
 * @param {Function} options.customUiOptionsFn - 接受一個選擇器找到的元素，返回要傳入customUiFn的參數。預設 (element) => element。
 * @param {Function} options.customUiFn - 自訂的 UI 函式。
 * @return {Function} - 返回一個清理函數，可以清理自訂UI。
 */
const convertToCustomUI = ({
  selector,
  customUiOptionsFn = (element) => element,
  customUiFn,
}) => {
  let selectorArray = null;

  // 檢查 selector 的類型並轉換成陣列
  if (typeof selector === 'string') {
    // 如果selector是字串代表使用的是選擇器
    selectorArray = document.querySelectorAll(selector);
  } else if (selector instanceof Element || selector === null) {
    // 如果是null或Element，則將selector轉換成陣列
    selectorArray = selector ? [selector] : [];
  } else if (selector instanceof NodeList || Array.isArray(selector)) {
    // 如果是NodeList或陣列，則將其轉換成陣列
    selectorArray = Array.from(selector).filter(
      (item) => item instanceof Element
    );
  }

  // 如果 selectorArray 為空或者不存在，直接返回
  if (!selectorArray || selectorArray.length === 0) {
    return;
  }
  const cleanupManager = getCleanupManager();

  // 取得所有符合 selector 的元素
  selectorArray.forEach((element) => {
    // 如果已有 data-converted 屬性代表已轉換過，則直接跳過避免重複轉換
    if (element.dataset.originalElement) return; // 避免重複轉換

    // 取得要傳入customUiFn的參數
    const params = customUiOptionsFn(element);
    const customUi = customUiFn(params);

    // 隱藏原本的元素
    element.style.display = 'none';
    // 將自訂選單插入到 DOM 結構中，放在原本的元素之後
    element.parentNode.insertBefore(customUi, element.nextSibling);
    // 將原本的元素引用給 customUi
    customUi.dataset.originalElement = element;

    // 將原本的UI顯示出來 並將customUi刪除
    cleanupManager.fns.push(() => {
      element.style.display = '';
      element.parentNode.removeChild(customUi);
    });
  });
  return () => {
    cleanupManager.runCleanup();
  };
};

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

// 建立一個清理工具
const cleanupManager = getCleanupManager();

// 測試：使用convertToCustomUI函數製作一個表格
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
