
import {
    select as d3_select
} from 'd3-selection';

import _debounce from 'lodash-es/debounce';
import { utilStringQs } from '../util';
import { /*uiToolAddFavorite, uiToolAddRecent, uiToolSearchAdd, */ uiToolAiFeaturesToggle, uiToolOldDrawModes, uiToolNotes, uiToolSave, uiToolSidebarToggle, uiToolUndoRedo, uiToolDownloadOsc } from './tools';


export function uiTopToolbar(context) {

    var sidebarToggle = uiToolSidebarToggle(context),
        aiFeaturesToggle = uiToolAiFeaturesToggle(context),
        modes = uiToolOldDrawModes(context),
        //searchAdd = uiToolSearchAdd(context),
        //addFavorite = uiToolAddFavorite(context),
        //addRecent = uiToolAddRecent(context),
        notes = uiToolNotes(context),
        undoRedo = uiToolUndoRedo(context),
        save = uiToolSave(context),
        downloadOsc = uiToolDownloadOsc(context);

    function notesEnabled() {
        var noteLayer = context.layers().layer('notes');
        return noteLayer && noteLayer.enabled();
    }

    function topToolbar(bar) {

        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });
        context.layers()
            .on('change.topToolbar', debouncedUpdate);

        context.presets()
            .on('favoritePreset.topToolbar', update)
            .on('recentsChange.topToolbar', update);

        update();

        function update() {

            var tools = [
                sidebarToggle,
                'spacer',
                modes,
                aiFeaturesToggle
            //    searchAdd
            ];
            /*
            if (context.presets().getFavorites().length > 0) {
                tools.push(addFavorite);
            }

            if (addRecent.shouldShow()) {
                tools.push(addRecent);
            }*/

            tools.push('spacer');

            if (notesEnabled()) {
                tools = tools.concat([notes, 'spacer']);
            }

            var q = utilStringQs(window.location.hash.substring(1));
            if (q.support_download_osc === 'true') {
                tools.push(downloadOsc);
            }
            tools = tools.concat([undoRedo, save]);

            var toolbarItems = bar.selectAll('.toolbar-item')
                .data(tools, function(d) {
                    return d.id || d;
                });

            toolbarItems.exit()
                .each(function(d) {
                    if (d.uninstall) {
                        d.uninstall();
                    }
                })
                .remove();

            var itemsEnter = toolbarItems
                .enter()
                .append('div')
                .attr('class', function(d) {
                    var classes = 'toolbar-item ' + (d.id || d).replace('_', '-');
                    if (d.klass) classes += ' ' + d.klass;
                    return classes;
                });

            var actionableItems = itemsEnter.filter(function(d) { return d !== 'spacer'; });

            actionableItems
                .append('div')
                .attr('class', 'item-content')
                .each(function(d) {
                    d3_select(this).call(d.render, bar);
                });

            actionableItems
                .append('div')
                .attr('class', 'item-label')
                .text(function(d) {
                    return d.label;
                });
        }

    }

    return topToolbar;
}
