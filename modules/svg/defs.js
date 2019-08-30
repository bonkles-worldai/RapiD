import { svg as d3_svg } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import { utilArrayUniq } from '../util';


/*
    A standalone SVG element that contains only a `defs` sub-element. To be
    used once globally, since defs IDs must be unique within a document.
*/
export function svgDefs(context) {

    function drawDefs(selection) {
        var defs = selection.append('defs');


        //Add AI feature discoverability layer filters/gradient fills
        //filter="url(#glownoise)" stroke="url(#aiDiscGradient)"
        var linearGradient = defs
            .append('linearGradient')
            .attr('id', 'aiDiscGradient')
            .attr('x1', '100%')
            .attr('y1', '100%')
        
        var stop1 = linearGradient
            .append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#ff26d4')
            .attr('stop-opacity', '.5')

        stop1
            .append('animate')
            .attr('attributeName', 'stop-color')
            .attr('values', '#ff26d4;fuchsia;hotpink;#ff26d4;hotpink;#ff26d4;purple;#ff26d4')
            .attr('dur', '14s')
            .attr('repeatCount', 'indefinite')

        var stop2 = linearGradient
            .append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#ff26d4')
            .attr('stop-opacity', '.5')
        stop2
            .append('animate')
            .attr('attributeName', 'stop-color')
            .attr('values', 'hotpink;#ff26d4;purple;#ff26d4;#ff48c5;#ff26d4;purple;#ff26d4;hotpink')
            .attr('dur', '14s')
            .attr('repeatCount', 'indefinite')
        stop2
            .append('animate')
            .attr('attributeName', 'offset')
            .attr('values', '.95;.80;.60;.40;.20;0;.20;.40;.60;.80;.95')
            .attr('dur', '14s')
            .attr('repeatCount', 'indefinite')

        var noiseFilter = defs
            .append('filter')
            .attr('id', 'glownoise')
            .attr('color-interpolation-filters', 'sRGB')
            .attr('x', '0%')
            .attr('y', '0%')
            .attr('height', '100%')
            .attr('width', '100%')

        noiseFilter
            .append('feTurbulence')
            .attr('type', 'fractalNoise')
            .attr('result', 'cloudbase')
            .attr('baseFrequency', '0.1')
            .attr('numOctaves', '5')
            .attr('seed', '24')

        var colorMatrix = noiseFilter
            .append('feColorMatrix')
            .attr('in', 'cloudbase')
            .attr('type', 'hueRotate')
            .attr('values', '0')
            .attr('result', 'cloud')
            
        colorMatrix
            .append('animate')
            .attr('attributeName', 'values')
            .attr('from', '0')
            .attr('to', '360')
            .attr('dur', '4s')
            .attr('repeatCount', 'indefinite')

        var colorMatrix2 = noiseFilter
            .append('feColorMatrix')
            .attr('in', 'cloud')
            .attr('result', 'wispy')
            .attr('type', 'matrix')
            .attr('values', '4 0 0 0 -1   4 0 0 0 -1   4 0 0 0 -1   1 0 0 0 0')

        noiseFilter
            .append('feFlood')
            .attr('flood-color', '#ff26d4')
            .attr('result', 'mlroadpink')

        noiseFilter
            .append('feBlend')
            .attr('mode', 'screen')
            .attr('in2', 'mlroadpink')
            .attr('in', 'wispy')

        noiseFilter
            .append('feGaussianBlur')
            .attr('stdDeviation', '12')

        noiseFilter
            .append('feComposite')
            .attr('operator', 'in')
            .attr('in2', 'SourceGraphic')

        // add markers
        defs
            .append('marker')
            .attr('id', 'oneway-marker')
            .attr('viewBox', '0 0 10 5')
            .attr('refX', 2.5)
            .attr('refY', 2.5)
            .attr('markerWidth', 2)
            .attr('markerHeight', 2)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'oneway-marker-path')
            .attr('d', 'M 5,3 L 0,3 L 0,2 L 5,2 L 5,0 L 10,2.5 L 5,5 z')
            .attr('stroke', 'none')
            .attr('fill', '#000')
            .attr('opacity', '0.75');

        // SVG markers have to be given a colour where they're defined
        // (they can't inherit it from the line they're attached to),
        // so we need to manually define markers for each color of tag
        // (also, it's slightly nicer if we can control the
        // positioning for different tags)
        function addSidedMarker(name, color, offset) {
            defs
                .append('marker')
                .attr('id', 'sided-marker-' + name)
                .attr('viewBox', '0 0 2 2')
                .attr('refX', 1)
                .attr('refY', -offset)
                .attr('markerWidth', 1.5)
                .attr('markerHeight', 1.5)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .append('path')
                .attr('class', 'sided-marker-path sided-marker-' + name + '-path')
                .attr('d', 'M 0,0 L 1,1 L 2,0 z')
                .attr('stroke', 'none')
                .attr('fill', color);
        }
        addSidedMarker('natural', 'rgb(140, 208, 95)', 0);
        // for a coastline, the arrows are (somewhat unintuitively) on
        // the water side, so let's color them blue (with a gap) to
        // give a stronger indication
        addSidedMarker('coastline', '#77dede', 1);
        // barriers have a dashed line, and separating the triangle
        // from the line visually suits that
        addSidedMarker('barrier', '#ddd', 1);
        addSidedMarker('man_made', '#fff', 0);

        defs
            .append('marker')
            .attr('id', 'viewfield-marker')
            .attr('viewBox', '0 0 16 16')
            .attr('refX', 8)
            .attr('refY', 16)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'viewfield-marker-path')
            .attr('d', 'M 6,14 C 8,13.4 8,13.4 10,14 L 16,3 C 12,0 4,0 0,3 z')
            .attr('fill', '#333')
            .attr('fill-opacity', '0.75')
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .attr('stroke-opacity', '0.75');

        defs
            .append('marker')
            .attr('id', 'viewfield-marker-wireframe')
            .attr('viewBox', '0 0 16 16')
            .attr('refX', 8)
            .attr('refY', 16)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'viewfield-marker-path')
            .attr('d', 'M 6,14 C 8,13.4 8,13.4 10,14 L 16,3 C 12,0 4,0 0,3 z')
            .attr('fill', 'none')
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .attr('stroke-opacity', '0.75');

        // add patterns
        var patterns = defs.selectAll('pattern')
            .data([
                // pattern name, pattern image name
                ['beach', 'dots'],
                ['construction', 'construction'],
                ['cemetery', 'cemetery'],
                ['cemetery_christian', 'cemetery_christian'],
                ['cemetery_buddhist', 'cemetery_buddhist'],
                ['cemetery_muslim', 'cemetery_muslim'],
                ['cemetery_jewish', 'cemetery_jewish'],
                ['farmland', 'farmland'],
                ['farmyard', 'farmyard'],
                ['forest', 'forest'],
                ['forest_broadleaved', 'forest_broadleaved'],
                ['forest_needleleaved', 'forest_needleleaved'],
                ['forest_leafless', 'forest_leafless'],
                ['grass', 'grass'],
                ['landfill', 'landfill'],
                ['meadow', 'grass'],
                ['orchard', 'orchard'],
                ['pond', 'pond'],
                ['quarry', 'quarry'],
                ['scrub', 'bushes'],
                ['vineyard', 'vineyard'],
                ['water_standing', 'lines'],
                ['waves', 'waves'],
                ['wetland', 'wetland'],
                ['wetland_marsh', 'wetland_marsh'],
                ['wetland_swamp', 'wetland_swamp'],
                ['wetland_bog', 'wetland_bog'],
                ['wetland_reedbed', 'wetland_reedbed']
            ])
            .enter()
            .append('pattern')
            .attr('id', function (d) { return 'pattern-' + d[0]; })
            .attr('width', 32)
            .attr('height', 32)
            .attr('patternUnits', 'userSpaceOnUse');

        patterns
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 32)
            .attr('height', 32)
            .attr('class', function (d) { return 'pattern-color-' + d[0]; });

        patterns
            .append('image')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 32)
            .attr('height', 32)
            .attr('xlink:href', function (d) {
                return context.imagePath('pattern/' + d[1] + '.png');
            });

        // add clip paths
        defs.selectAll('clipPath')
            .data([12, 18, 20, 32, 45])
            .enter()
            .append('clipPath')
            .attr('id', function (d) { return 'clip-square-' + d; })
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function (d) { return d; })
            .attr('height', function (d) { return d; });

        // add symbol spritesheets
        defs
            .call(drawDefs.addSprites, [
                'iD-sprite', 'maki-sprite', 'temaki-sprite', 'fa-sprite', 'tnp-sprite', 'community-sprite'
            ], true);
    }


    drawDefs.addSprites = function(selection, ids, overrideColors) {
        var spritesheets = selection.selectAll('.spritesheet');
        var currData = spritesheets.data();
        var data = utilArrayUniq(currData.concat(ids));

        spritesheets
            .data(data)
            .enter()
            .append('g')
            .attr('class', function(d) { return 'spritesheet spritesheet-' + d; })
            .each(function(d) {
                var url = context.imagePath(d + '.svg');
                var node = d3_select(this).node();

                d3_svg(url)
                    .then(function(svg) {
                        node.appendChild(
                            d3_select(svg.documentElement).attr('id', d).node()
                        );
                        if (overrideColors && d !== 'iD-sprite') {   // allow icon colors to be overridden..
                            d3_select(node).selectAll('path')
                                .attr('fill', 'currentColor');
                        }
                    })
                    .catch(function() {
                        /* ignore */
                    });
            });
    };


    return drawDefs;
}
