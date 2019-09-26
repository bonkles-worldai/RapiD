import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import {
    behaviorBreathe,
    behaviorHover,
    behaviorLasso,
    behaviorSelect
} from '../behavior';

import { t } from '../util/locale';

import { modeBrowse, modeDragNode, modeDragNote } from '../modes';
import { serviceFbMLRoads } from '../services';
import { uiFbRoadPicker } from '../ui';
import { utilKeybinding } from '../util';

var _expandedOnce = false;


export function modeSelectAiFeatures(context, selectedDatum) {
    var mode = {
        id: 'select-ai-features',
        button: 'browse'
    };

    var keybinding = utilKeybinding('select-ai-features');
    var roadsGraph = serviceFbMLRoads.graph();
    var roadPicker = uiFbRoadPicker(context, keybinding);

    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];


    // class the data as selected, or return to browse mode if the data is gone
    function selectData(drawn) {
        var selection = context.surface().selectAll('.layer-ai-features .data' + selectedDatum.__fbid__);

        if (selection.empty()) {
            // Return to browse mode if selected DOM elements have
            // disappeared because the user moved them out of view..
            var source = d3_event && d3_event.type === 'zoom' && d3_event.sourceEvent;
            if (drawn && source && (source.type === 'mousemove' || source.type === 'touchmove')) {
                context.enter(modeBrowse(context));
            }
        } else {
            selection.classed('selected', true);
        }
    }


    function esc() {
        if (d3_select('.combobox').size()) return;
        context.enter(modeBrowse(context));
    }


    mode.selectedIDs = function() {
        return [selectedDatum.id];
    };


    mode.zoomToSelected = function() {
        var extent = selectedDatum.extent(roadsGraph);
        context.map().centerZoomEase(extent.center(), context.map().trimmedExtentZoom(extent));
    };


    mode.enter = function() {
        behaviors.forEach(context.install);

        keybinding
            .on(t('inspector.zoom_to.key'), mode.zoomToSelected)
            .on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        selectData();

        var sidebar = context.ui().sidebar;
        sidebar.show(roadPicker.datum(selectedDatum));

        if (!_expandedOnce) {
            // Expand sidebar at least once per session to inform user how to
            // accept and reject proposed roads.
            _expandedOnce = true;
            // expand the sidebar, avoid obscuring the data if needed
            var extent = selectedDatum.extent(roadsGraph);
            sidebar.expand(sidebar.intersects(extent));
        }

        context.map()
            .on('drawn.select-ai-features', selectData);
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.surface()
            .selectAll('.layer-ai-features .selected')
            .classed('selected hover', false);

        context.map()
            .on('drawn.select-ai-features', null);

        context.ui().sidebar
            .hide();
    };


    return mode;
}
