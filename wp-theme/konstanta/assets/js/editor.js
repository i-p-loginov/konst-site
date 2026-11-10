/* Редактор: настройки блоков темы «Константа». Без сборки — чистый wp.* API. */
(function (wp) {
  "use strict";
  var el = wp.element.createElement;
  var Fragment = wp.element.Fragment;
  var be = wp.blockEditor;
  var c = wp.components;
  var SSR = wp.serverSideRender;

  function text(props, key, label, multiline, help) {
    return el(multiline ? c.TextareaControl : c.TextControl, {
      label: label,
      help: help,
      value: props.attributes[key] || "",
      onChange: function (v) {
        var o = {};
        o[key] = v;
        props.setAttributes(o);
      },
      __nextHasNoMarginBottom: true
    });
  }
  function toggle(props, key, label) {
    return el(c.ToggleControl, {
      label: label,
      checked: !!props.attributes[key],
      onChange: function (v) {
        var o = {};
        o[key] = v;
        props.setAttributes(o);
      },
      __nextHasNoMarginBottom: true
    });
  }
  function adminLink(href, label) {
    return el("p", null, el("a", { href: href, target: "_blank", rel: "noopener" }, label));
  }

  function edit(name, panel) {
    return function (props) {
      var blockProps = be.useBlockProps();
      return el(
        Fragment,
        null,
        el(be.InspectorControls, null, el(c.PanelBody, { title: "Настройки", initialOpen: true }, panel(props))),
        el("div", blockProps, el(c.Disabled, null, el(SSR, { block: name, attributes: props.attributes })))
      );
    };
  }

  wp.blocks.registerBlockType("konstanta/branch-map", {
    edit: edit("konstanta/branch-map", function (props) {
      return [
        adminLink("edit.php?post_type=konst_branch", "Редактировать отделения и участки →"),
        text(props, "panelTitle", "Заголовок панели"),
        text(props, "panelText", "Подсказка в панели", true),
        text(props, "sitesLabel", "Подпись перед участками"),
        text(props, "initial", "Отделение, выбранное при открытии", false, "Полное или короткое название, например «Пригородное отделение»"),
        text(props, "buttonText", "Текст кнопки", false, "Оставьте пустым, чтобы скрыть кнопку"),
        text(props, "buttonUrl", "Ссылка кнопки", false, "По умолчанию — страница «Контакты»")
      ];
    }),
    save: function () {
      return null;
    }
  });

  wp.blocks.registerBlockType("konstanta/request-form", {
    edit: edit("konstanta/request-form", function (props) {
      return [
        adminLink("edit.php?post_type=konst_request", "Поступившие заявки →"),
        adminLink("edit.php?post_type=konst_request&page=konstanta-requests", "Куда отправлять заявки →"),
        text(props, "title", "Заголовок"),
        text(props, "lead", "Подзаголовок", true),
        text(props, "messagePlaceholder", "Подсказка в поле «Сообщение»"),
        text(props, "buttonText", "Текст кнопки"),
        text(props, "successText", "Сообщение после отправки", true),
        toggle(props, "showEmail", "Поле Email"),
        toggle(props, "showBranch", "Выбор отделения")
      ];
    }),
    save: function () {
      return null;
    }
  });

  /* У кнопок оставляем только стили темы. */
  wp.domReady(function () {
    ["fill", "outline"].forEach(function (s) {
      try {
        wp.blocks.unregisterBlockStyle("core/button", s);
      } catch (e) {}
    });
  });
})(window.wp);
