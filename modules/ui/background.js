import _debounce from 'lodash-es/debounce';

import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { uiBackgroundDisplayOptions } from './background_display_options';
import { uiGridDisplayOptions } from './grid_display_options';
import { uiBackgroundOffset } from './background_offset';
import { uiCmd } from './cmd';
import { uiDisclosure } from './disclosure';
import { uiMapInMap } from './map_in_map';
import { uiSettingsCustomBackground } from './settings/custom_background';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';
import { easeCubicInOut as d3_easeCubicInOut } from 'd3-ease';

export function uiBackground(context) {
    var key = t('background.key');

    var _pane = d3_select(null);

    var _customSource = context.background().findSource('custom');
    var _previousBackground = context.background().findSource(context.storage('background-last-used-toggle'));

    var _backgroundList = d3_select(null);
    var _overlayList = d3_select(null);
    var _displayOptionsContainer = d3_select(null);
    var _gridOptionsContainer = d3_select(null);
    var _offsetContainer = d3_select(null);

    var gridDisplayOptions = uiGridDisplayOptions(context);
    var backgroundDisplayOptions = uiBackgroundDisplayOptions(context);
    var backgroundOffset = uiBackgroundOffset(context);

    var settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    const favoriteBackgroundsJSON = context.storage('background-favorites');
    const _favoriteBackgrounds = favoriteBackgroundsJSON ? JSON.parse(favoriteBackgroundsJSON) : {};


    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            var item = d3_select(this).select('label');
            var span = item.select('span');
            var placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var description = d.description();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(tooltip().destroyAny);

            if (d === _previousBackground) {
                item.call(tooltip()
                    .placement(placement)
                    .html(true)
                    .title(function() {
                        var tip = '<div>' + t('background.switch') + '</div>';
                        return uiTooltipHtml(tip, uiCmd('⌘' + key));
                    })
                );
            } else if (description || isOverflowing) {
                item.call(tooltip()
                    .placement(placement)
                    .title(description || d.name())
                );
            }
        });
    }


    function updateLayerSelections(selection) {
        function active(d) {
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .classed('switch', function(d) { return d === _previousBackground; })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        d3_event.preventDefault();
        _previousBackground = context.background().baseLayerSource();
        context.storage('background-last-used-toggle', _previousBackground.id);
        context.storage('background-last-used', d.id);
        context.background().baseLayerSource(d);
        _backgroundList.call(updateLayerSelections);
        document.activeElement.blur();
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            chooseBackground(_customSource);
        } else {
            _customSource.template('');
            chooseBackground(context.background().findSource('none'));
        }
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomBackground);
    }


    function chooseOverlay(d) {
        d3_event.preventDefault();
        context.background().toggleOverlayLayer(d);
        _overlayList.call(updateLayerSelections);
        document.activeElement.blur();
    }


    function sortSources(a, b) {
        return _favoriteBackgrounds[a.id] && !_favoriteBackgrounds[b.id] ? -1
            : _favoriteBackgrounds[b.id] && !_favoriteBackgrounds[a.id] ? 1
            : a.best() && !b.best() ? -1
            : b.best() && !a.best() ? 1
            : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
    }


    function drawListItems(layerList, type, change, filter) {
        var sources = getBackgrounds(filter);

        var layerLinks = layerList.selectAll('li')
            .data(sources, function(d) { return d.name(); });

        layerLinks.exit()
            .remove();

        var layerLinksEnter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function(d) { return d.id === 'custom'; })
            .classed('best', function(d) { return d.best(); });
        
        var label = layerLinksEnter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'layers')
            .on('change', change);

        label
            .append('span')
            .attr('class', 'background-name')
            .text(function(d) { return d.name(); });

        layerLinksEnter
            .append('button')
            .attr('class', 'background-favorite-button')
            .classed('active', (d) => { return !!_favoriteBackgrounds[d.id]; })
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-favorite'))
            .on('click', (d, i, nodes) => {
                if (_favoriteBackgrounds[d.id]) {
                    d3_select(nodes[i]).classed('active', false);
                    delete _favoriteBackgrounds[d.id];
                } else {
                    d3_select(nodes[i]).classed('active', true);
                    _favoriteBackgrounds[d.id] = true;
                }
                context.storage('background-favorites', JSON.stringify(_favoriteBackgrounds));
        
                d3_select(nodes[i].parentElement)
                    .transition()
                    .duration(300)
                    .ease(d3_easeCubicInOut)
                    .style('background-color', 'orange')
                        .transition()
                        .duration(300)
                        .ease(d3_easeCubicInOut)
                        .style('background-color', null);
        
                layerList.selectAll('li')
                    .sort(sortSources);
                layerList
                    .call(updateLayerSelections);
                nodes[i].blur(); // Stop old de-stars from having grey background
            });

        layerLinksEnter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'layer-browse')
            .call(tooltip()
                .title(t('settings.custom_background.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        layerLinksEnter.filter(function(d) { return d.best(); })
            .selectAll('label')
            .append('span')
            .attr('class', 'best')
            .attr('title', t('background.best_imagery'))
            .call(svgIcon('#iD-icon-best-background'));


        layerList.selectAll('li')
            .sort(sortSources);

        layerList
            .call(updateLayerSelections);


    }


    function renderBackgroundList(selection) {

        // the background list
        var container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .attr('dir', 'auto')
            .merge(container);


        // add minimap toggle below list
        var bgExtrasListEnter = selection.selectAll('.bg-extras-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list bg-extras-list');

        var minimapLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'minimap-toggle-item')
            .append('label')
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('background.minimap.tooltip'), t('background.minimap.key')))
                .placement('top')
            );

        minimapLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                d3_event.preventDefault();
                uiMapInMap.toggle();
            });

        minimapLabelEnter
            .append('span')
            .text(t('background.minimap.description'));


        var panelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'background-panel-toggle-item')
            .append('label')
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('background.panel.tooltip'), uiCmd('⌘⇧' + t('info_panels.background.key'))))
                .placement('top')
            );

        panelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                d3_event.preventDefault();
                context.ui().info.toggle('background');
            });

        panelLabelEnter
            .append('span')
            .text(t('background.panel.description'));


        // "Info / Report a Problem" link
        selection.selectAll('.imagery-faq')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'imagery-faq')
            .append('a')
            .attr('target', '_blank')
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
            .append('span')
            .text(t('background.imagery_problem_faq'));

        updateBackgroundList();
    }


    function renderOverlayList(selection) {
        var container = selection.selectAll('.layer-overlay-list')
            .data([0]);

        _overlayList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-overlay-list')
            .attr('dir', 'auto')
            .merge(container);

        updateOverlayList();
    }


    function updateBackgroundList() {
        _backgroundList
            .call(drawListItems, 'radio', chooseBackground, function(d) { return !d.isHidden() && !d.overlay; });
    }


    function updateOverlayList() {
        _overlayList
            .call(drawListItems, 'checkbox', chooseOverlay, function(d) { return !d.isHidden() && d.overlay; });
    }


    function update() {
        if (!_pane.select('.disclosure-wrap-background_list').classed('hide')) {
            updateBackgroundList();
        }

        if (!_pane.select('.disclosure-wrap-overlay_list').classed('hide')) {
            updateOverlayList();
        }

        _gridOptionsContainer
            .call(gridDisplayOptions);

        _displayOptionsContainer
            .call(backgroundDisplayOptions);

        _offsetContainer
            .call(backgroundOffset);
    }


    function quickSwitch() {
        if (d3_event) {
            d3_event.stopImmediatePropagation();
            d3_event.preventDefault();
        }
        if (_previousBackground) {
            chooseBackground(_previousBackground);
        }
    }


    function getBackgrounds(filter) {
        return context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter);
    }


    function chooseBackgroundAtOffset(offset) {
        const backgrounds = getBackgrounds(function(d) { return !d.isHidden() && !d.overlay; });
        backgrounds.sort(sortSources);
        const currentBackground = context.background().baseLayerSource();
        const foundIndex = backgrounds.indexOf(currentBackground);
        if (foundIndex === -1) {
            // Can't find the current background, so just do nothing
            return;
        }

        let nextBackgroundIndex = (foundIndex + offset + backgrounds.length) % backgrounds.length;
        let nextBackground = backgrounds[nextBackgroundIndex];
        if (nextBackground.id === 'custom' && !nextBackground.template()) {
            nextBackgroundIndex = (nextBackgroundIndex + offset + backgrounds.length) % backgrounds.length;
            nextBackground = backgrounds[nextBackgroundIndex];
        }
        chooseBackground(nextBackground);
    }


    function nextBackground() {
        chooseBackgroundAtOffset(1);
    }


    function previousBackground() {
        chooseBackgroundAtOffset(-1);
    }


    var paneTooltip = tooltip()
        .placement((textDirection === 'rtl') ? 'right' : 'left')
        .html(true)
        .title(uiTooltipHtml(t('background.description'), key));

    uiBackground.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide();
        context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
    };


    function hidePane() {
        context.ui().togglePanes();
    }


    uiBackground.renderToggleButton = function(selection) {

        selection
            .append('button')
            .on('click', uiBackground.togglePane)
            .call(svgIcon('#iD-icon-layers', 'light'))
            .call(paneTooltip);
    };


    uiBackground.renderPane = function(selection) {

        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane background-pane hide')
            .attr('pane', 'background');


        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('background.title'));

        heading
            .append('button')
            .on('click', hidePane)
            .call(svgIcon('#iD-icon-close'));


        var content = _pane
            .append('div')
            .attr('class', 'pane-content');

        // background list
        content
            .append('div')
            .attr('class', 'background-background-list-container')
            .call(uiDisclosure(context, 'background_list', true)
                .title(t('background.backgrounds'))
                .content(renderBackgroundList)
            );

        // overlay list
        content
            .append('div')
            .attr('class', 'background-overlay-list-container')
            .call(uiDisclosure(context, 'overlay_list', true)
                .title(t('background.overlays'))
                .content(renderOverlayList)
            );

        // grid list
        _gridOptionsContainer = content
            .append('div')
            .attr('class', 'grid-overlay-list-container'); 
        
        context.rapidContext().on('task_extent_set.background', function() {
            // Show grid options only if the task bbox is rectangular 
            if (!context.rapidContext().isTaskRectangular()) {
                _gridOptionsContainer.remove();
            }
        });
        
        // display options
        _displayOptionsContainer = content
            .append('div')
            .attr('class', 'background-display-options');

        // offset controls
        _offsetContainer = content
            .append('div')
            .attr('class', 'background-offset');


        // add listeners
        context.map()
            .on('move.background-update',
                _debounce(function() { window.requestIdleCallback(update); }, 1000)
            );


        context.background()
            .on('change.background-update', update);


        update();

        context.keybinding()
            .on(key, uiBackground.togglePane)
            .on(uiCmd('⌘' + key), quickSwitch)
            .on(t('background.next_background.key'), nextBackground)
            .on(t('background.previous_background.key'), previousBackground);
    };

    return uiBackground;
}
