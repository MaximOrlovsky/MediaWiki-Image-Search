;(function($, window, document, undefined){

    /**
     * Control Image loading process
     *
     * @type {{images: Array, imagesCount: number, updateCallback: boolean, finishedCount: number, finishedPercent: number, run: run, load: load, update: update}}
     */
    var Loader = {
        images : [],
        imagesCount : 0,
        updateCallback : false,
        finishedCount : 0,
        finishedPercent : 0,

        /**
         * Main method.
         *
         * @param images Array Urls
         * @param updateCallback Function Will be ran after image loaded
         */
        run : function (images, updateCallback) {
            this.images = images;
            this.imagesCount = images.length;
            this.updateCallback = updateCallback;

            this.finishedCount = 0;
            this.finishedPercent = 0;

            if ( this.imagesCount ) {
                this.load();
            }
        },
        /**
         * Preload images.
         * Control the process of loading.
         */
        load : function () {
            var collection = [],
                self = this;
            for (var image in this.images) {
                collection[image] = new Image();
                collection[image].onload = function(){
                    if ( this.complete ) {
                        if ( this.naturalWidth ) {
                            self.update(this.src, true);
                        }
                        else {
                            self.update(this.src, false);
                        }
                    }
                };
                collection[image].onerror = function(){
                    if ( this.complete ) {
                        self.update(this.src, false);
                    }
                };

                collection[image].src = this.images[image];
            }
        },
        /**
         * Call callback 'updateCallback' when images was loaded.
         *
         * @param url String Image Url
         * @param isSuccess Bool Is image load was success ot not
         */
        update : function (url, isSuccess) {
            this.finishedCount++;
            this.finishedPercent = 100 * this.finishedCount / this.imagesCount;
            if ( typeof this.updateCallback == 'function' ) {
                this.updateCallback(this.finishedPercent, url, isSuccess);
            }
        }
    }


    /**
     * Build and control the Gallery
     *
     * @type {{serverUrl: string, apiUrl: string, search: string, count: number, maxHistoryStates: number, images: Array, history: {}, container: {}, progress: {}, loadMoreButton: {}, notFoundMessage: {}, finishMessage: {}, emptyMessage: {}, noSearchMessage: {}, overlayBg: {}, overlayContainer: {}, template: {single: {}, plural: {}}, preparedImages: Array, searchCurrent: string, searchNextPage: string, fired: boolean, clearBeforeBuild: boolean, run: run, load: load, clear: clear, build: build, saveHistory: saveHistory, loadHistory: loadHistory, loadMore: loadMore, showNoSearchMessage: showNoSearchMessage, hideNoSearchMessage: hideNoSearchMessage, showNotFoundMessage: showNotFoundMessage, hideNotFoundMessage: hideNotFoundMessage, showLoadMoreButton: showLoadMoreButton, hideLoadMoreButton: hideLoadMoreButton, showFinishMessage: showFinishMessage, hideFinishMessage: hideFinishMessage, showEmptyMessage: showEmptyMessage, hideEmptyMessage: hideEmptyMessage, updateProgressCallback: updateProgressCallback, showSingle: showSingle, hideSingle: hideSingle, _getPreviousAndNextImageByUrl: _getPreviousAndNextImageByUrl, _getNextColumnForMasonry: _getNextColumnForMasonry, _prepareName: _prepareName}}
     */
    var Gallery = {

        /** Url of server */
        serverUrl : 'http://en.wikipedia.org',
        /** API Url. It can be customized */
        apiUrl : '/w/api.php',
        /** Search term */
        search : '',
        /** How many images we'll try to get in every request. 500 is maximum */
        count : 20,
        /** How many searches will be saved in history */
        maxHistoryStates: 12,

        /** Collection of retrieved images */
        images : [],
        /** Collection of history states */
        history: {},
        /** jQuery element of main Gallery container (where Columns locates)*/
        container : {},
        /** jQuery element of Progress Bar*/
        progress: {},
        /** jQuery element of button to load more images */
        loadMoreButton : {},
        /** jQuery element of message when server returned 0 results */
        notFoundMessage : {},
        /** jQuery element of message when we had results but there is no new images */
        finishMessage : {},
        /** jQuery element of message when server faults */
        emptyMessage : {},
        /** jQuery element of message on empty search form */
        noSearchMessage : {},
        /** jQuery element of Single Image overlay background */
        overlayBg : {},
        /** jQuery element of Single Image container*/
        overlayContainer : {},
        /** Templates */
        template : {
            /** jQuery element of template for single image */
            single : {},
            /** jQuery element of template for image in list*/
            plural : {}
        },

        /** Simplified this.image collection */
        preparedImages : [],
        /** Actual search */
        searchCurrent : '',
        /** Serch term for next page */
        searchNextPage : '',
        /** Is Gallery was built */
        fired : false,
        /** Does run clear before build Gallery*/
        clearBeforeBuild : true,

        /**
         * Main method
         * @param options
         */
        run : function(options){
            this.serverUrl = options.serverUrl || this.serverUrl;
            this.apiUrl = options.apiUrl || this.apiUrl;
            this.search = options.search || this.search;
            this.count = options.count || this.count;

            this.container = options.container;
            this.progress = options.progress;

            this.loadMoreButton = options.loadMoreButton;
            this.notFoundMessage = options.notFoundMessage;
            this.finishMessage = options.finishMessage;
            this.emptyMessage = options.emptyMessage;
            this.noSearchMessage = options.noSearchMessage;

            this.overlayContainer = options.overlayContainer;
            this.overlayBg = options.overlayBg;

            this.template.single = options.singleTemplate;
            this.template.plural = options.pluralTemplate;

            if ( this.search ) {
                // fire
                this.hideNoSearchMessage();
                this.searchCurrent = this.search;
                this.clearBeforeBuild = true;
                this.load();
            }
            else {
                //error
                this.showNoSearchMessage();
            }
        },

        /**
         * Loads image collection via API
         */
        load : function(){
            this.searchNextPage = '';

            $.ajax({
                url : this.serverUrl + this.apiUrl,
                data : {
                    action: 'query',
                    list: 'allimages',
                    format: 'json',
                    aifrom : this.searchCurrent,
                    aisort : 'name',
                    ailimit : this.count,
                    aiprop:'dimensions|mime|user|url'
                },
                method: 'get',
                dataType: 'jsonp',
                crossOrigin: true,
                context: this,
                success : function(data){
                    if (data.hasOwnProperty('query') && data.query.hasOwnProperty('allimages') && data.query.allimages.length ) {
                        if ( data.hasOwnProperty('query-continue') && data['query-continue'].hasOwnProperty('allimages') && data['query-continue'].allimages.hasOwnProperty('aicontinue') && data['query-continue'].allimages.aicontinue ) {
                            this.searchNextPage = data['query-continue'].allimages.aicontinue;
                        }
                        else {
                            this.hideLoadMoreButton();
                        }
                        this.images = data.query.allimages;
                        this.build();
                    }
                    else {
                        this.hideLoadMoreButton();
                    }
                },
                error : function(xhr, error) {
                    this.showEmptyMessage();
                }
            });
        },

        /**
         * Clear result of previous build
         */
        clear : function() {
            this.progress.css('width', 0);
            this.hideLoadMoreButton();
            this.hideNotFoundMessage();
            this.hideFinishMessage();
            this.hideEmptyMessage();
            this.container.find('.item').remove();
            this.container.attr('data-columns', 0);
            this.container.find('.column').attr('data-real-height',0);
        },

        /**
         * Build the gallery in masonry view.
         */
        build: function(){
            var imageTemplate, imageName, currentColumnHeight,
                parent, parentNext, parentHeight, parentNextHeight,
                images = this.images || [],
                columns = this.container.find('.column:visible'),
                columnsLength = columns.length,
                columnsCount = 0;

            // Clear masonry
            if ( this.clearBeforeBuild ) {
                this.clear();
            }

            this.saveHistory();

            this.fired = true;

            // Build
            if ( images.length ) {
                for (var image in images) {

                    if ( images[image]['mime'] != 'image/jpeg' && images[image]['mime'] != 'image/png' ) { continue }

                    imageName = Gallery._prepareName(images[image]['name']);
                    imageTemplate = this.template.plural.clone();

                    imageTemplate.find('.image').attr({
                        src : images[image]['url'],
                        alt : imageName,
                        height: images[image]['height'],
                        width: images[image]['width']
                    });
                    imageTemplate.find('.title').html(imageName);
                    imageTemplate.find('.author').html(images[image]['user']);

                    // Build Masonry
                    parent = this.container;
                    parentHeight = parseInt(parent.attr('data-real-height'), 10) || 0;
                    if ( columnsLength ) {
                        if ( columns[columnsCount] ) {
//                            parent = $(columns[columnsCount]);
                            currentColumnHeight = 0;
                            parent = this._getNextColumnForMasonry(columns, images[image]['width'], images[image]['height']);
                        }
                    }
                    parent.append(imageTemplate);

                    // Prepare array to control image loading
                    this.preparedImages.push(images[image]['url']);
                }

                // Preload images
                if ( this.preparedImages ) {
                    Loader.run(this.preparedImages, this.updateProgressCallback());
                }

                if ( this.preparedImages && this.searchNextPage ) {
                    this.showLoadMoreButton();
                }
                else {
                    this.hideLoadMoreButton();
                    this.showFinishMessage();
                }
            }
            else {
                this.showNotFoundMessage();
            }

        },

        /**
         * Save last search in history collection
         */
        saveHistory : function(){
            var date,
                cleanHistory = {},
                cleanHistoryCount = 0,
                d = new Date();

            date = d.getYear()+ '-' + d.getMonth() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes();

            this.history[this.search] = {
                date : date,
                images : this.images,
                next : this.searchNextPage
            };

            // save only limited states of the history
            for ( var state in this.history ) {
                if ( this.history.hasOwnProperty(state) ) {
                    cleanHistoryCount++;
                    cleanHistory[state] = this.history[state];
                    if (cleanHistoryCount == this.maxHistoryStates) {
                        break;
                    }
                }
            }
            if ( cleanHistory ) {
                this.history = cleanHistory;
            }
        },

        /**
         * Rebuild search result from history by search term
         * @param search String
         */
        loadHistory : function(search){
            var collection = this.history[search];
            if ( collection.length ) {
                this.search = collection.search;
                this.searchNextPage = collection.next;
                this.images = collection.images;

                this.build();
            }
        },

        /**
         * Load next page of search
         */
        loadMore : function(){
            this.clearBeforeBuild = false;
            this.searchCurrent = this.searchNextPage;
            this.load();
        },

        /**
         * Show message when search line is empty
         */
        showNoSearchMessage : function(){
            this.noSearchMessage.removeClass('hidden');
        },

        /**
         * Hide message when search line is empty
         */
        hideNoSearchMessage : function(){
            this.noSearchMessage.addClass('hidden');
        },

        /**
         * Show message when server returns 0 results
         */
        showNotFoundMessage : function(){
            this.notFoundMessage.removeClass('hidden');
        },

        /**
         * Hide message when server returns 0 results
         */
        hideNotFoundMessage : function(){
            this.notFoundMessage.addClass('hidden');
        },

        /**
         * Show button Load More to proceed next page
         */
        showLoadMoreButton : function(){
            this.loadMoreButton.removeClass('hidden');
        },


        /**
         * Hide button Load More
         */
        hideLoadMoreButton : function(){
            this.loadMoreButton.addClass('hidden');
        },


        /**
         * Show message when no more search results
         */
        showFinishMessage : function(){
            this.finishMessage.find('.query').html(this.search);
            this.finishMessage.removeClass('hidden');
        },

        /**
         * Hide message when no more search results
         */
        hideFinishMessage : function(){
            this.finishMessage.addClass('hidden');
        },

        /**
         * Show message when server faults
         */
        showEmptyMessage : function(){
            this.emptyMessage.find('.url').attr('href', this.serverUrl).html(this.serverUrl);
            this.emptyMessage.find('.api').attr('href', this.serverUrl + this.apiUrl);
            this.emptyMessage.removeClass('hidden');
        },

        /**
         * Hide message when server faults
         */
        hideEmptyMessage : function(){
            this.emptyMessage.addClass('hidden');
        },

        /**
         * Update progress bar with results of loading
         * @returns {Function} Callback function
         */
        updateProgressCallback : function(){
            var progressElement = this.progress;
            return function( percent, image, isSuccess ) {
                var item = $('img[src="' + image +'"]').closest('.item');

                // update progress
                if ( percent >= 100 ) {
                    percent = 0;
                }
                progressElement.css({
                    width: percent + '%'
                });

                // show current image
                if (isSuccess) {
                    item.addClass('ready');
                }
                else {
                    item.remove();
                }
            }
        },

        /**
         * Show single image template with navigation
         * @param item {Object} jQuery element '.item'
         */
        showSingle : function(item) {
            var scale = 0.6,
                template = this.template.single.clone(),
                image = item.find('.image'),
                title = item.find('.title'),
                author = item.find('.author'),
                siblings;

            template.find('.author').html( author.html() );
            template.find('.image').attr({
                src : image.attr('src'),
                alt : image.attr('alt'),
                width : image.attr('width'),
                height: image.attr('height')
            });
            template.find('.title').html( title.html() );

            // get next and previous images
            siblings = this._getPreviousAndNextImageByUrl(image.attr('src'));
            if ( siblings['prev'] ) {
                template.find('.prev img').attr('src', siblings['prev']);
            }
            if ( siblings['next'] ) {
                template.find('.next img').attr('src', siblings['next']);
            }

            // show overlays
            this.overlayBg
                    .height( $(document).height() )
                    .removeClass('hidden');

            this.overlayContainer
                    .html(template)
                    .css({
                        top : parseInt($(window).scrollTop(), 10) + parseInt(  parseInt($(window).height(), 10) * 0.05 , 10)
                    })
                    .removeClass('hidden');

        },
        /**
         * Hide opened Single image
         */
        hideSingle : function() {
            this.overlayContainer.addClass('hidden').html();
            this.overlayBg.addClass('hidden');
        },

        /**
         * Return previous and next Url of selected image from image collection
         * Helper for showSingleImage()
         *
         * @param url {String}
         * @returns {{prev: *, next: *}}
         * @private
         */
        _getPreviousAndNextImageByUrl : function(url) {
            var preparedImagesLength = parseInt(this.preparedImages.length, 10),
                current = parseInt( this.preparedImages.indexOf(url), 10),
                next = (current+1 == preparedImagesLength ) ? 0 : current + 1,
                prev = (current-1 <= 0 ) ? preparedImagesLength-1 : current - 1;

            return {
                prev : this.preparedImages[prev],
                next : this.preparedImages[next]
            }

        },
        /**
         * Builds masonry view
         * Helper for build()
         *
         * @param columns {Object} Collection of jQuery objects '.column'
         * @param imgWidth {Number} Current image width
         * @param imgHeight {Number} Current image height
         * @returns {Object} jQuery object of column where we plan to past current image
         * @private
         */
        _getNextColumnForMasonry : function(columns, imgWidth, imgHeight) {
            var minValue,
                currentColumnRealHeight = 0,
                currentImageRealHeight = 0,
                currentColumnRealWidth = 0,
                preparedColumns = [],
                imgHeight = imgHeight || 0,
                imgWidth = imgWidth || 0;

            for ( var i=0; i<(columns.length); i++ ) {
                currentColumnRealHeight = parseInt($(columns[i]).attr('data-real-height'),10) || 0;
                currentColumnRealWidth = parseInt($(columns[i]).width(),10) || 0;
                currentImageRealHeight = parseInt(currentColumnRealWidth * imgHeight / imgWidth, 10);
                preparedColumns.push([i, currentColumnRealHeight + currentImageRealHeight]);
            }

            minValue = preparedColumns.sort(function(a, b){return a[1]-b[1]})[0];
            $(columns[minValue[0]]).attr('data-real-height', minValue[1]);

            return $(columns[minValue[0]]);
        },

        /**
         * Prepare name to show (remove dashes)
         * Helper
         *
         * @param name {String}
         * @returns {String}
         * @private
         */
        _prepareName : function(name) {
            name = name.replace(/[-_]/gi, ' ');
            name = name.substring(0, name.lastIndexOf('.'));
            return name;
        }

    };

    // Start the action
    $(document).ready(function(){

        var header = $('#header'),
            templates = $('#templates'),
            container = $('#container'),
            home = $('#home'),
            panel = $('#panel'),
            progress = $('#progress .bar'),
            searchForm = container.find('form.search'),
            loadMoreButton = container.find('.load-more'),
            notFoundMessage = container.find('.not-found-message'),
            finishMessage = container.find('.finish-message'),
            emptyMessage = container.find('.empty-message'),
            noSearchMessage = container.find('.no-search-message'),
            overlayContainer = $('.overlayContainer'),
            overlayBg = $('.overlayBg'),
            singleTemplate = templates.find('.template-single figure.single'),
            pluralTemplate = templates.find('.template-plural figure.item');

        /**
         * Submit search form
         */
        searchForm.on('submit', function(e){
            var search = $(this).find('input[name=search]').val(),
                options;

            e.preventDefault();

            // pass search term to all search forms
            container.find('input[name=search]').val(search);

            // change view
            if ( search && $(this).hasClass('at-home') ) {
                container.addClass('work');
            }


            // build Gallery
            options = {
                serverUrl: 'http://www.mediawiki.org',
                apiUrl: '/w/api.php',
                container: panel,
                search: search,
                imagesCount: 20,
                progress: progress,
                loadMoreButton: loadMoreButton,
                notFoundMessage: notFoundMessage,
                finishMessage: finishMessage,
                emptyMessage: emptyMessage,
                noSearchMessage: noSearchMessage,
                overlayContainer : overlayContainer,
                overlayBg : overlayBg,
                singleTemplate: singleTemplate,
                pluralTemplate: pluralTemplate
            };
            Gallery.run(options);
        });

        /**
         * Click on image in masonry view
         */
        container.on('click', '.item', function(e){
            e.preventDefault();
            Gallery.showSingle( $(this) );
        });

        /**
         * Click on close button of Single Image view
         */
        overlayContainer.on('click', '.single .close a', function(e){
            e.preventDefault();
            Gallery.hideSingle();
        });

        /**
         * Click on navigation (previous/next image) of Single Image view
         */
        overlayContainer.on('click', '.single .nav a', function(e){
            e.preventDefault();
            overlayContainer.addClass('hidden');
            Gallery.showSingle( panel.find('.item .image[src="' + $(this).find('img').attr('src') + '"]').closest('.item') );
        });

        /**
         * Click on home-link
         */
        container.find('.back-to-home').on('click', function(e){
            e.preventDefault();
            container.removeClass('work');
            container.find('input[name=search]').val('');

            setTimeout(function(){
                Gallery.clear();
            },500);
        });

        /**
         * Click on Load More button below the masonry view
         */
        loadMoreButton.on('click', function(e){
            e.preventDefault();
            Gallery.loadMore();
        });

        /**
         * Keyboard arrows for navigation in Single Image view
         */
        $(document).on('keydown', function(e){
            if ( overlayContainer.filter(':visible').length ) {
                e = e || window.event;
                switch (e.keyCode) {
                    // left arrow - show previous image
                    case 37 :
                        overlayContainer.find('.single .nav.prev a').trigger('click');
                        break;
                    // right arrow - show next image
                    case 39 :
                        overlayContainer.find('.single .nav.next a').trigger('click');
                        break;
                    // escape - close Single view
                    case 27 :
                        overlayContainer.find('.single .close a').trigger('click');
                        break;
                }
            }
        });

        // add focus by default to search input on home
        searchForm.filter(':visible').focus();

        /**
         * Fire the event only every 'ms' milliseconds
         */
        var waitForFinalEvent = (function(){
            var timeout = 0;
            return function(cb, ms){
                clearTimeout(timeout);
                timeout = setTimeout(cb, ms);
            }
        })();
        /**
         * Rebuild masonry view when window size was changed
         */
        $(window).on('resize', function(){
            waitForFinalEvent(function(){
                var currentColumnsCount = container.find('.column:visible').length,
                    previousColumnsCount = panel.attr('data-columns');

                if ( !previousColumnsCount ) {
                    previousColumnsCount = currentColumnsCount;
                    panel.attr('data-columns', currentColumnsCount );
                }

                if ( Gallery.fired ) {
                    if ( previousColumnsCount != currentColumnsCount ) {
                        panel.attr('data-columns', currentColumnsCount );
                        // Rebuild gallery masonry
                        Gallery.build();
                    }
                }

            }, 500);
        });

    });

    // end of Ready

})(jQuery, window, document);