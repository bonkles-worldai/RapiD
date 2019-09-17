import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { uiDisclosure } from './disclosure';


export function uiGridDisplayOptions(context) {
    function chooseGrid(d) {
        d3_event.preventDefault();
        context.background().numGridSplits(d.numSplit); 
    }


    function render(selection) {
        // the grid list
        var container = selection.selectAll('.layer-grid-list')
            .data([0]);

        var gridList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-grid-list')
            .attr('dir', 'auto')
            .merge(container);

            var gridItems = gridList.selectAll('li')
                .data(
                    [{numSplit: 0, name: t('background.grid.no_grid')},
                     {numSplit: 2, name: t('background.grid.n_by_n', {num: 2})},
                     {numSplit: 3, name: t('background.grid.n_by_n', {num: 3})},
                     {numSplit: 4, name: t('background.grid.n_by_n', {num: 4})},
                     {numSplit: 5, name: t('background.grid.n_by_n', {num: 5})},
                     {numSplit: 6, name: t('background.grid.n_by_n', {num: 6})}], 
                    function(d) { return d.name; }
                );

            var enter = gridItems.enter()
                .insert('li', '.custom-gridsopt')
                .attr('class', 'gridsopt'); 

            var label = enter.append('label'); 
            label.append('input')
                .attr('type', 'radio')
                .attr('name', 'grids')
                .property('checked', function(d){
                    return (d.numSplit === context.background().numGridSplits());
                })
                .on('change', chooseGrid); 
            
            label.append('span')
                .text(function(d) {return d.name}); 
            
            gridItems.exit()
                .remove(); 

            selection.style('display', 'block')
    }


    function gridDisplayOptions(selection) {
        _selection = selection;

        selection
            .call(uiDisclosure(context, 'grid_display_options', true)
                .title(t('background.grid.grids'))
                .content(render)
            );
    }


    return gridDisplayOptions;
}
