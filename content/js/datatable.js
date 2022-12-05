(function ($) {
    const iconTheme = 'material-icons';
    const iconTag = "span";
    const pageSizes = [10, 25, 50, 100];

    $.fn.dataTable = function (options, sortBy, sortMode) {
        var curOptions = setDefaultOptions(options);
        options.footer = $(options.footer);
        var instance = factory(this, curOptions, sortBy, sortMode);
        renderLayout(this, instance);
        if (curOptions && curOptions.data) {
            instance.load(curOptions.data);
        }
        return instance;
    }

    var factory = function (el, opt, sortCol, sortMode) {
        var instance = {
            element: el.get(0),
            $element: el,
            options: null,
            sortBy: sortCol || 0,
            sortMode: sortMode || "Ascending",
            currentPage: 0,
            dataSource: null,
            data: null,
            components: {},
            headings: {},
            updatingData: false,
            currentFilter: null,
            filter: function (text) {
                instance.currentFilter = text;
                if (instance.dataSource) {
                    var filteredData = filter(instance.dataSource, instance.headings, text);
                    instance.data = sortData(instance, instance.sortBy, filteredData, instance.options, instance.sortMode);
                    update(instance);
                }
            },
            load: function (data) {
                instance.dataSource = data;
                instance.data = cloneArray(instance.dataSource);
                instance.data = sortData(instance, instance.sortBy, instance.data, instance.options, instance.sortMode);
                update(instance);
            },
            refresh: function () {
                if (instance.currentFilter && instance.currentFilter != "") {
                    instance.filter(instance.currentFilter)
                } else {
                    instance.data = cloneArray(instance.dataSource);
                    instance.data = sortData(instance, instance.sortBy, instance.data, instance.options, instance.sortMode);
                    update(instance);
                }
            },
            firstPage: function () {
                instance.gotoPage(0);
            },
            lastPage: function () {
                if (!instance.data) {
                    return;
                }
                var lastPage = Math.ceil(instance.data.length / instance.options.pageSize);
                instance.gotoPage(lastPage - 1);
            },
            nextPage: function () {
                if (!instance.data) {
                    return;
                }
                var maxPage = (instance.data.length / instance.options.pageSize);
                if (instance.currentPage < (maxPage - 1)) {
                    var page = instance.currentPage + 1;
                    instance.gotoPage(page);
                }
            },
            previousPage: function () {
                if (instance.currentPage > 0) {
                    var page = instance.currentPage - 1;
                    instance.gotoPage(page);
                }
            },
            gotoPage: function (pageIndex) {
                if (!instance.data) {
                    return;
                }
                var page = pageIndex;
                var maxPage = Math.ceil(instance.data.length / instance.options.pageSize);
                if (page > maxPage) {
                    page = maxPage - 1;
                } else if (page < 0) {
                    page = 0;
                }
                instance.currentPage = page;
                update(instance);
            }
        };
        initializeInstance(el, instance, opt);

        instance.sortBy = sortCol;
        return instance;
    }

    function filter(data, headings, text){
        var results = [];
        for(var i=0;i<data.length;i++){
            var row = data[i];
            for(var j=0;j<row.length;j++){
                if (row[j] && row[j].toString().toLowerCase().includes(text.toLowerCase())){
                    isVisible=false;
                    if (headings[j]) {
                        isVisible = headings[j].visible;
                    }
                    if (isVisible){
                        results.push(data[i]);
                        break;
                    }
                }
            }
        }
        return results;
    }

    function cloneArray(source) {
        return source.map(function (arr) {
            return arr.slice();
        });
    }
    function update(instance) {
        instance.updatingData = true;
        renderSortType(instance);
        renderPageSelect(instance, "paging-item js-page-size");
        render(instance);
        instance.updatingData = false;
    }

    function initializeInstance(el, instance, options) {
        instance.options = options;
        instance.components.container = $(el);
        instance.components.table = instance.components.container.find("table");
        instance.components.tbody = {};
        //Headers
        var header = instance.components.table.find("thead");
        instance.components.thead = header;
        instance.components.headers = header.find("th");
        instance.headings = [];
        for (var i = 0; i < instance.components.headers.length; i++) {
            var header = instance.components.headers[i];
            var $header = $(header);
            var text = $header.text();
            $header.empty();
            var $container = $("<div class='data-header'></div>");
            $container.append($("<p>" + text + "</p>"));
            $container.append(renderIcon(""));
            $header.append($container);
            var colOption = getColumnOption(instance, i, instance.options);
            if (colOption.colType === "hidden") {
                header.style.display = "none";
                instance.headings.push({
                    'text': text,
                    'visible': false
                });
            } else {
                instance.headings.push({
                    'text': text,
                    'visible': true
                });
            }
        }
    }

    function setDefaultOptions(options) {
        if (!options.sortBy) {
            options.sortBy = 0;
        }
        options.pageSize = getCookie("pageSize") || pageSizes[0];
        if (!options.usePaging === false) {
            options.usePaging = true;
        }
        return options;
    }

    function renderLayout(el, instance) {
        var pageSize = getCookie("pageSize") || "10";
        $(".js-page-size").val(pageSize);
        renderTable(instance);
        // renderPagingLayout(instance);
        attachEvents(instance);
    }

    function renderTable(instance) {
        var bodyEl = instance.components.table.find("tbody");
        if (bodyEl.length == 0) {
            bodyEl = document.createElement("tbody");
            instance.components.table.append(bodyEl);
        }
        var $body = $(bodyEl);
        instance.components.tbody = $body;
    }

    function attachEvents(instance) {
        var filter = $("#datatable-filter");
        if (filter.length > 0) {
            instance.components.filter = filter;
            instance.components.filter.on("keyup", function () {
                var text = $(this).val();
                instance.filter(text);
            })
        }
        instance.components.headers.on("click", function () {
            for (var i = 0; i < instance.components.headers.length; i++) {
                if (instance.components.headers[i] === this) {
                    if (i == instance.sortBy) {
                        instance.sortMode = instance.sortMode == "Descending" ? "Ascending" : "Descending";
                    }
                    instance.sortBy = i;
                    instance.refresh();
                }
            }
        });

        $(".js-page-size", instance.element).on("change", function () {
            var val = $(this).val();
            setCookie("pageSize", val);
            instance.options.pageSize = val;
            instance.gotoPage(0);
        });
        $(".js-page-previous", instance.element).on("click", instance.previousPage);
        $(".js-page-first", instance.element).on("click", instance.firstPage);
        $(".js-page-last", instance.element).on("click", instance.lastPage);
        $(".js-page-next", instance.element).on("click", instance.nextPage);
        $(".js-page-select", instance.element).on("change", function () {
            if (!instance.updatingData) {
                var page = $(this).val();
                instance.gotoPage(page);
            }
        });
    }

    function render(instance) {
        console.log("[SCOREBOT] Rendering datatable");
        renderData(instance);
    }

    function renderData(instance) {
        instance.components.tbody.empty();
        var data = instance.data;
        var start = 0;
        var end = data.length;
        var pageSize = data.length;
        if (instance.options.usePaging) {
            var pageSize = parseInt(instance.options.pageSize);
        }
        if (instance.options.usePaging) {
            start = instance.currentPage * pageSize;
            end = start + pageSize;
            if (start > data.length) {
                start = data.length;
            }
            if (end > data.length) {
                end = data.length;
            }
        }
        var options = [];
        for (var i = 0; i < instance.components.headers.length; i++) {
            var colOption = getColumnOption(instance, i, instance.options);

            options.push(colOption);
        }
        for (var i = start; i < end; i++) {
            var rowEl = document.createElement("tr");
            for (var j = 0; j < instance.components.headers.length; j++) {
                var colEl = document.createElement("td");
                var colOption = options[j];
                if (colOption.colType === "hidden") {
                    colEl.style.display = "none";
                }
                colEl.dataset.row = i;
                colEl.dataset.col = j;
                var col = colOption.dataColumn;
                if (colOption.onRenderCell) {
                    if (colOption.colType === "computed") {
                        colOption.onRenderCell(i, col, colEl, "", data[i]);
                    } else {
                        colOption.onRenderCell(i, col, colEl, data[i][col], data[i]);
                    }
                } else {
                    colEl.innerHTML = data[i][col];
                }
                colEl.classList.add("column");
                colEl.classList.add("column-" + j);
                if (colOption.class) {
                    colEl.classList.add(colOption.class);
                }
                $(colEl).on("click", function (evt) {
                    cellClick(evt, instance);
                });
                rowEl.appendChild(colEl);
            }
            if (instance.options.onRenderRow) {
                instance.options.onRenderRow(i, rowEl, data[i]);
            }
            instance.components.tbody.append(rowEl);
        }
    }

    function cellClick(evt, instance) {
        var target = evt.target;
        if (target) {
            var row = target.dataset.row;
            var col = target.dataset.col;
            var data = instance.data[row][col];
            var rowData = instance.data[row];
            if (instance.options.onCellClick) {
                instance.options.onCellClick(row, col, data, rowData);
            }
            $(instance.element).find("tr.selected").removeClass("selected");
            $(target).closest("tr").addClass("selected");
        }
    }

    function renderIcon(iconName) {
        return $("<" + iconTag + " class='icon " + iconTheme + "'>" + iconName + "</" + iconTag + ">");
    }

    function renderSortType(instance) {
        if (!instance.components.headers || instance.components.headers.length == 0) {
            return;
        }
        for (var i = 0; i < instance.components.headers.length; i++) {
            var header = $(instance.components.headers[i]);
            var icon = "";
            if (instance.sortBy == i) {
                if (instance.sortMode == "Ascending") {
                    icon = "south";
                } else {
                    icon = "north";
                }
            }
            header.find(".icon").text(icon);
        };
    }

    function renderPageSelect(instance, classStr) {
        var $select = $(".js-page-select", instance.element);
        if ($select.length == 0) {
            $select = $("<select class='js-page-select " + classStr + " browser-default'></select>");
        }
        $select.empty();
        if (instance.data) {
            var pages = Math.ceil(instance.data.length / instance.options.pageSize);
            for (var i = 0; i < pages; i++) {
                var option = {};
                if (instance.currentPage == i) {
                    option = $("<option value='" + i + "' selected>" + (i + 1) + "/" + pages + "</option>");
                } else {
                    option = $("<option value='" + i + "'>" + (i + 1) + "/" + pages + "</option>");
                }
                $select.append(option);
            }
        }
        return $select;
    }

    function renderPageSizeSelector(instance, classStr) {
        var $pageSize = $(".js-page-size", instance.element);
        if ($pageSize.length == 0) {
            $pageSize = $("<select class='js-page-size " + classStr + " browser-default'></select>");
        }

        var currentPageSize = parseInt(instance.options.pageSize);
        for (var i = 0; i < pageSizes.length; i++) {
            var option = "";
            if (currentPageSize === pageSizes[i]) {
                option = $("<option value='" + pageSizes[i] + "' selected>" + pageSizes[i] + "</option>");
            } else {
                option = $("<option value='" + pageSizes[i] + "'>" + pageSizes[i] + "</option>");
            }
            $pageSize.append(option);
        }
        return $pageSize;
    }

    function renderButton(subtype, classStr) {
        var btnClass = "btn";
        if (subtype) {
            btnClass = btnClass + "-" + subtype;
        }
        return $("<a href='#!' class='" + btnClass + " " + classStr + " '></a>");
    }

    function renderButtonWithIcon(iconName, subtype, classStr) {
        var btnClass = "btn";
        if (subtype) {
            btnClass = btnClass + "-" + subtype;
        }
        var element = renderButton(subtype, classStr);
        var icon = renderIcon(iconName);
        element.append(icon);
        return element;
    }

    function sortData(instance, colIndex, data, options, sortMode) {
        var col = getColumnOption(instance, colIndex, options);
        var sortFn = getSortFnByColType(col.colType);
        return data.sort((a, b) => { return sortFn(a, b, col.dataColumn, sortMode) });
    }

    function getColumnOption(instance, colIndex, options) {
        var dataCol = colIndex
        if (instance.components.headers && instance.components.headers.length >= colIndex) {
            var header = instance.components.headers[colIndex];
            if (header && header.dataset.col) {
                dataCol = parseInt(header.dataset.col);
            }
        }
        if (options.columns) {
            var option = options.columns.find(x => x.col == colIndex);
            if (option) {
                option.dataColumn = dataCol;
                return option;
            }
        }
        return {
            col: colIndex,
            colType: "string",
            dataColumn: dataCol
        };
    }

    function getSortFnByColType(colType) {
        if (colType === "numeric") {
            return numericSort;
        } else if (colType === "date") {
            return dateSort;
        }
        return defaultSort;
    }

    function defaultSort(a, b, sortBy, sortMode) {

        if (a[sortBy] > b[sortBy]) {
            var val = sortMode == "Ascending" ? 1 : -1;
            return val;
        }
        if (a[sortBy] < b[sortBy]) {
            var val = sortMode == "Ascending" ? -1 : 1;
            return val;
        }
        return 0;

    }

    function numericSort(a, b, sortBy, sortMode) {
        var avalue = parseInt(a[sortBy]);
        var bvalue = parseInt(b[sortBy]);
        var val = avalue - bvalue;
        if (sortMode != "Ascending") {
            if (val > 0) {
                return -1;
            }
            if (val < 0) {
                return 1;
            }
        }
        return val;
    }
    function dateSort(a, b, sortBy, sortMode) {
        var avalue = new Date(a[sortBy]);
        var bvalue = new Date(b[sortBy]);
        var val = avalue - bvalue;
        if (sortMode != "Ascending") {
            if (val > 0) {
                return -1;
            }
            if (val < 0) {
                return 1;
            }
        }
        return val;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
}($));