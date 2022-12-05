/* MATERIALIZE MultiSelect with filter extension */
window.addEventListener("scoreBotReady", event => {

    M.FormSelect.prototype._setValueToInput = function () {
        let values = [];
        let options = this.$el.find('option');

        options.each((el) => {
            if ($(el).prop('selected')) {
                var text = "";
                if (options.useValueForText) {
                    text = $(el).val();
                }else{
                    text = $(el).val();
                }
                values.push(text);
            }
        });

        if (!values.length) {
            let firstDisabled = this.$el.find('option:disabled').eq(0);
            if (firstDisabled.length && firstDisabled[0].value === '') {
                values.push(firstDisabled.text());
            }
        }

        this.input.value = values.join(', ');
    }

    document.querySelectorAll('select[searchable]').forEach(elem => {
        const selectInstance = elem.M_FormSelect;
        const $elem = $(elem);

        selectInstance.loadOptions = function (items, mantainSelection) {
            var selection = [];
            if (mantainSelection) {
                selection = getArrayFromSelection($elem.val());
            }
            $elem.find("option").remove();
            if (mantainSelection) {
                for (var key in items) {
                    if (selection.indexOf(key) >= 0) {
                        $elem.append("<option value='" + key + "' selected>" + items[key].value + "</option>");
                    }
                }
            }
            for (var key in items) {
                if (selection.indexOf(key) < 0 || !mantainSelection) {
                    $elem.append("<option value='" + key + "'>" + items[key].value + "</option>");
                }
            }
            selectInstance.items = items;
            M.FormSelect.init($elem,);
            initialize(elem.M_FormSelect);
            elem.M_FormSelect.dropdown.options.onCloseEnd = function () {
                selectInstance.sortOptions();
            }
        }


        selectInstance.sortOptions = function () {
            var $ul = $(elem).find("ul");
            var sortedItems = $ul.find("li").sort(function (a, b) {
                var aslected = $(a).hasClass("selected");
                var bslected = $(b).hasClass("selected");

                if (aslected && bslected) {
                    return 0;
                }
                if (aslected && !bslected) {
                    return -1;
                }
                if (!aslected && bslected) {
                    return 1;
                }
            });
            $ul.find("li").remove();
            for (var item of sortedItems) {
                $ul.append(item);
            }
        }
        function getArrayFromSelection(selectedItems) {
            var result = [];
            for (var item in selectedItems) {
                result.push(selectedItems[item]);
            }
            return result;
        }
        function getOptions(instance) {
            return instance.dropdownOptions.querySelectorAll('li:not(.optgroup)');
        }
        function initialize(select) {
            // Add search box to dropdown
            var options = getOptions(select);
            const placeholderText = select.el.getAttribute('searchable');
            const searchBox = document.createElement('div');
            searchBox.style.padding = '6px 16px 0 16px';
            searchBox.innerHTML = `
                <div class="input-field">
                <input type="text" placeholder="${placeholderText}">
                </input><label>Filter</label></div>`;
            searchBox.classList.add("filter");
            select.dropdownOptions.prepend(searchBox);
            select.dropdown.options.coverTrigger = false;
            // Function to filter dropdown options
            function filterOptions(event) {
                const searchText = event.target.value.toLowerCase();

                options.forEach(option => {
                    const value = option.textContent.toLowerCase();
                    const display = value.indexOf(searchText) === -1 ? 'none' : 'block';
                    option.style.display = display;
                });

                select.dropdown.recalculateDimensions();
            }

            // Function to give keyboard focus to the search input field
            function focusSearchBox() {
                searchBox.firstElementChild.focus({
                    preventScroll: true
                });
            }

            select.dropdown.options.autoFocus = false;

            if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                select.input.addEventListener('click', focusSearchBox);
                options.forEach(option => {
                    option.addEventListener('click', focusSearchBox);
                });
            }
            searchBox.addEventListener('keyup', filterOptions);
        }
        initialize(selectInstance);
    });
});