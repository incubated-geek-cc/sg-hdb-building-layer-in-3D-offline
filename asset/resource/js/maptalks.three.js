/*!
 * maptalks.three v0.17.0
 * LICENSE : MIT
 * (c) 2016-2021 maptalks.org
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks'), require('three')) :
    typeof define === 'function' && define.amd ? define(['exports', 'maptalks', 'three'], factory) :
    (global = global || self, factory(global.maptalks = global.maptalks || {}, global.maptalks, global.THREE));
}(this, (function (exports, maptalks, THREE) { 'use strict';

    /**
     * three api adapt
     */
    const REVISION = parseInt(THREE.REVISION.replace('dev', ''));
    //Three does not print version information now. Output the version of three to find compatibility problems
    console.log(`maptalks.three log: current three.js version is %c${REVISION}`, 'color:red;font-size: 16px;font-weight: bold;');
    /**
     *
     * @param {THREE.BufferGeometry} bufferGeomertry
     * @param {String} key
     * @param {*} value
     */
    function addAttribute(bufferGeomertry, key, value) {
        if (REVISION > 109) {
            bufferGeomertry.setAttribute(key, value);
        }
        else {
            bufferGeomertry.addAttribute(key, value);
        }
        return bufferGeomertry;
    }
    function setRaycasterLinePrecision(raycaster, linePrecision) {
        if (REVISION > 113) {
            raycaster.params.Line.threshold = linePrecision;
        }
        else {
            raycaster.linePrecision = linePrecision;
        }
    }
    function getVertexColors() {
        if (THREE.VertexColors) {
            return THREE.VertexColors;
        }
        return true;
    }

    /**
     * @author WestLangley / http://github.com/WestLangley
     *
     */
    class LineSegmentsGeometry extends THREE.InstancedBufferGeometry {
        constructor() {
            super();
            this.isLineSegmentsGeometry = true;
            this.type = 'LineSegmentsGeometry';
            var positions = [-1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0, 1, -1, 0];
            var uvs = [-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2];
            var index = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5];
            this.setIndex(index);
            addAttribute(this, 'position', new THREE.Float32BufferAttribute(positions, 3));
            addAttribute(this, 'uv', new THREE.Float32BufferAttribute(uvs, 2));
        }
        // THREE.InstancedBufferGeometry.call(this);
        // var plane = new THREE.BufferGeometry();
        // this.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        // this.addAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        applyMatrix(matrix) {
            var start = this.attributes.instanceStart;
            var end = this.attributes.instanceEnd;
            if (start !== undefined) {
                matrix.applyToBufferAttribute(start);
                matrix.applyToBufferAttribute(end);
                start.data.needsUpdate = true;
            }
            if (this.boundingBox !== null) {
                this.computeBoundingBox();
            }
            if (this.boundingSphere !== null) {
                this.computeBoundingSphere();
            }
            return this;
        }
        setPositions(array) {
            var lineSegments;
            if (array instanceof Float32Array) {
                lineSegments = array;
            }
            else if (Array.isArray(array)) {
                lineSegments = new Float32Array(array);
            }
            var instanceBuffer = new THREE.InstancedInterleavedBuffer(lineSegments, 6, 1); // xyz, xyz
            addAttribute(this, 'instanceStart', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 0));
            addAttribute(this, 'instanceEnd', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 3));
            // this.addAttribute('instanceStart', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 0)); // xyz
            // this.addAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 3)); // xyz
            //
            this.computeBoundingBox();
            this.computeBoundingSphere();
            return this;
        }
        setColors(array) {
            var colors;
            if (array instanceof Float32Array) {
                colors = array;
            }
            else if (Array.isArray(array)) {
                colors = new Float32Array(array);
            }
            var instanceColorBuffer = new THREE.InstancedInterleavedBuffer(colors, 6, 1); // rgb, rgb
            addAttribute(this, 'instanceColorStart', new THREE.InterleavedBufferAttribute(instanceColorBuffer, 3, 0));
            addAttribute(this, 'instanceColorEnd', new THREE.InterleavedBufferAttribute(instanceColorBuffer, 3, 3));
            // this.addAttribute('instanceColorStart', new THREE.InterleavedBufferAttribute(instanceColorBuffer, 3, 0)); // rgb
            // this.addAttribute('instanceColorEnd', new THREE.InterleavedBufferAttribute(instanceColorBuffer, 3, 3)); // rgb
            return this;
        }
        fromWireframeGeometry(geometry) {
            this.setPositions(geometry.attributes.position.array);
            return this;
        }
        fromEdgesGeometry(geometry) {
            this.setPositions(geometry.attributes.position.array);
            return this;
        }
        fromMesh(mesh) {
            this.fromWireframeGeometry(new THREE.WireframeGeometry(mesh.geometry));
            // set colors, maybe
            return this;
        }
        fromLineSegements(lineSegments) {
            var geometry = lineSegments.geometry;
            if (geometry.isGeometry) {
                this.setPositions(geometry.vertices);
            }
            else if (geometry.isBufferGeometry) {
                this.setPositions(geometry.position.array); // assumes non-indexed
            }
            // set colors, maybe
            return this;
        }
        computeBoundingBox() {
            var box = new THREE.Box3();
            if (this.boundingBox === null) {
                this.boundingBox = new THREE.Box3();
            }
            var start = this.attributes.instanceStart;
            var end = this.attributes.instanceEnd;
            if (start !== undefined && end !== undefined) {
                this.boundingBox.setFromBufferAttribute(start);
                box.setFromBufferAttribute(end);
                this.boundingBox.union(box);
            }
        }
        computeBoundingSphere() {
            var vector = new THREE.Vector3();
            if (this.boundingSphere === null) {
                this.boundingSphere = new THREE.Sphere();
            }
            if (this.boundingBox === null) {
                this.computeBoundingBox();
            }
            var start = this.attributes.instanceStart;
            var end = this.attributes.instanceEnd;
            if (start !== undefined && end !== undefined) {
                var center = this.boundingSphere.center;
                this.boundingBox.getCenter(center);
                var maxRadiusSq = 0;
                for (var i = 0, il = start.count; i < il; i++) {
                    vector.fromBufferAttribute(start, i);
                    maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(vector));
                    vector.fromBufferAttribute(end, i);
                    maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(vector));
                }
                this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
                if (isNaN(this.boundingSphere.radius)) {
                    console.error('THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this);
                }
            }
        }
        toJSON() {
            // todo
        }
        // clone: function () {
        //     // todo
        // },
        // eslint-disable-next-line no-unused-vars
        copy(source) {
            // todo
            return this;
        }
    }

    /**
     * @author WestLangley / http://github.com/WestLangley
     *
     * parameters = {
     *  color: <hex>,
     *  linewidth: <float>,
     *  dashed: <boolean>,
     *  dashScale: <float>,
     *  dashSize: <float>,
     *  gapSize: <float>,
     *  resolution: <Vector2>, // to be set by renderer
     * }
     */
    const UniformsLib = {}, ShaderLib = {};
    UniformsLib.line = {
        linewidth: { value: 1 },
        resolution: { value: new THREE.Vector2(1, 1) },
        dashScale: { value: 1 },
        dashSize: { value: 1 },
        gapSize: { value: 1 } // todo FIX - maybe change to totalSize
    };
    ShaderLib['line'] = {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.fog,
            UniformsLib.line
        ]),
        vertexShader: `
        #include <common>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

        uniform float linewidth;
        uniform vec2 resolution;

        attribute vec3 instanceStart;
        attribute vec3 instanceEnd;

        attribute vec3 instanceColorStart;
        attribute vec3 instanceColorEnd;

        varying vec2 vUv;

        #ifdef USE_DASH

            uniform float dashScale;
            attribute float instanceDistanceStart;
            attribute float instanceDistanceEnd;
            varying float vLineDistance;

        #endif

        void trimSegment( const in vec4 start, inout vec4 end ) {

            // trim end segment so it terminates between the camera plane and the near plane

            // conservative estimate of the near plane
            float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
            float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
            float nearEstimate = - 0.5 * b / a;

            float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

            end.xyz = mix( start.xyz, end.xyz, alpha );

        }

        void main() {

            #ifdef USE_COLOR

                vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

            #endif

            #ifdef USE_DASH

                vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;

            #endif

            float aspect = resolution.x / resolution.y;

            vUv = uv;

            // camera space
            vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
            vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

            // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
            // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
            // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
            // perhaps there is a more elegant solution -- WestLangley

            bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

            if ( perspective ) {

                if ( start.z < 0.0 && end.z >= 0.0 ) {

                    trimSegment( start, end );

                } else if ( end.z < 0.0 && start.z >= 0.0 ) {

                    trimSegment( end, start );

                }

            }

            // clip space
            vec4 clipStart = projectionMatrix * start;
            vec4 clipEnd = projectionMatrix * end;

            // ndc space
            vec2 ndcStart = clipStart.xy / clipStart.w;
            vec2 ndcEnd = clipEnd.xy / clipEnd.w;

            // direction
            vec2 dir = ndcEnd - ndcStart;

            // account for clip-space aspect ratio
            dir.x *= aspect;
            dir = normalize( dir );

            // perpendicular to dir
            vec2 offset = vec2( dir.y, - dir.x );

            // undo aspect ratio adjustment
            dir.x /= aspect;
            offset.x /= aspect;

            // sign flip
            if ( position.x < 0.0 ) offset *= - 1.0;

            // endcaps
            if ( position.y < 0.0 ) {

                offset += - dir;

            } else if ( position.y > 1.0 ) {

                offset += dir;

            }

            // adjust for linewidth
            offset *= linewidth;

            // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
            offset /= resolution.y;

            // select end
            vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

            // back to clip space
            offset *= clip.w;

            clip.xy += offset;

            gl_Position = clip;

            vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            #include <fog_vertex>

        }
        `,
        fragmentShader: `
        uniform vec3 diffuse;
        uniform float opacity;

        #ifdef USE_DASH

            uniform float dashSize;
            uniform float gapSize;

        #endif

        varying float vLineDistance;

        #include <common>
        #include <color_pars_fragment>
        #include <fog_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>

        varying vec2 vUv;

        void main() {

            #include <clipping_planes_fragment>

            #ifdef USE_DASH

                if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

                if ( mod( vLineDistance, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

            #endif

            if ( abs( vUv.y ) > 1.0 ) {

                float a = vUv.x;
                float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
                float len2 = a * a + b * b;

                if ( len2 > 1.0 ) discard;

            }

            vec4 diffuseColor = vec4( diffuse, opacity );

            #include <logdepthbuf_fragment>
            #include <color_fragment>

            gl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a );

            #include <premultiplied_alpha_fragment>
            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>

        }
        `
    };
    class LineMaterial extends THREE.ShaderMaterial {
        constructor(parameters) {
            super({
                uniforms: THREE.UniformsUtils.clone(ShaderLib['line'].uniforms),
                vertexShader: ShaderLib['line'].vertexShader,
                fragmentShader: ShaderLib['line'].fragmentShader
            });
            this.dashed = true;
            this.isLineMaterial = true;
            this.type = 'LineMaterial';
            Object.defineProperties(this, {
                color: {
                    enumerable: true,
                    get: function () {
                        return this.uniforms.diffuse.value;
                    },
                    set: function (value) {
                        this.uniforms.diffuse.value = value;
                    }
                },
                linewidth: {
                    enumerable: true,
                    get: function () {
                        return this.uniforms.linewidth.value;
                    },
                    set: function (value) {
                        this.uniforms.linewidth.value = value;
                    }
                },
                dashScale: {
                    enumerable: true,
                    get: function () {
                        return this.uniforms.dashScale.value;
                    },
                    set: function (value) {
                        this.uniforms.dashScale.value = value;
                    }
                },
                dashSize: {
                    enumerable: true,
                    get: function () {
                        return this.uniforms.dashSize.value;
                    },
                    set: function (value) {
                        this.uniforms.dashSize.value = value;
                    }
                },
                gapSize: {
                    enumerable: true,
                    get: function () {
                        return this.uniforms.gapSize.value;
                    },
                    set: function (value) {
                        this.uniforms.gapSize.value = value;
                    }
                },
                resolution: {
                    enumerable: true,
                    get: function () {
                        return this.uniforms.resolution.value;
                    },
                    set: function (value) {
                        this.uniforms.resolution.value.copy(value);
                    }
                }
            });
            this.setValues(parameters);
        }
    }

    /**
     * @author WestLangley / http://github.com/WestLangley
     *
     */
    class LineSegments2 extends THREE.Mesh {
        constructor(geometry, material) {
            super(geometry, material);
            this.isLineSegments2 = true;
            this.type = 'LineSegments2';
            this.geometry = geometry !== undefined ? geometry : new LineSegmentsGeometry();
            this.material = material !== undefined ? material : new LineMaterial({ color: Math.random() * 0xffffff });
        }
        computeLineDistances() {
            var start = new THREE.Vector3();
            var end = new THREE.Vector3();
            var geometry = this.geometry;
            var instanceStart = geometry.attributes.instanceStart;
            var instanceEnd = geometry.attributes.instanceEnd;
            var lineDistances = new Float32Array(2 * instanceStart.data.count);
            for (var i = 0, j = 0, l = instanceStart.data.count; i < l; i++, j += 2) {
                start.fromBufferAttribute(instanceStart, i);
                end.fromBufferAttribute(instanceEnd, i);
                lineDistances[j] = (j === 0) ? 0 : lineDistances[j - 1];
                lineDistances[j + 1] = lineDistances[j] + start.distanceTo(end);
            }
            var instanceDistanceBuffer = new THREE.InstancedInterleavedBuffer(lineDistances, 2, 1); // d0, d1
            addAttribute(geometry, 'instanceDistanceStart', new THREE.InterleavedBufferAttribute(instanceDistanceBuffer, 1, 0));
            addAttribute(geometry, 'instanceDistanceEnd', new THREE.InterleavedBufferAttribute(instanceDistanceBuffer, 1, 1));
            // geometry.addAttribute('instanceDistanceStart', new THREE.InterleavedBufferAttribute(instanceDistanceBuffer, 1, 0)); // d0
            // geometry.addAttribute('instanceDistanceEnd', new THREE.InterleavedBufferAttribute(instanceDistanceBuffer, 1, 1)); // d1
            return this;
        }
    }

    /**
     * @author WestLangley / http://github.com/WestLangley
     *
     */
    class LineGeometry extends LineSegmentsGeometry {
        constructor() {
            super();
            this.isLineGeometry = true;
            this.type = 'LineGeometry';
        }
        fromLine(line) {
            var geometry = line.geometry;
            if (geometry.isGeometry) {
                this.setPositions(geometry.vertices);
            }
            else if (geometry.isBufferGeometry) {
                this.setPositions(geometry.position.array); // assumes non-indexed
            }
            return this;
        }
    }

    /**
     * @author WestLangley / http://github.com/WestLangley
     *
     */
    class Line2 extends LineSegments2 {
        constructor(geometry, material) {
            super(geometry, material);
            this.isLine2 = true;
            this.type = 'Line2';
            this.geometry = geometry !== undefined ? geometry : new LineGeometry();
            this.material = material !== undefined ? material : new LineMaterial({ color: Math.random() * 0xffffff });
        }
        copy(source) {
            return this;
        }
    }

    const OPTIONS = {
        interactive: true,
        altitude: 0,
        minZoom: 0,
        maxZoom: 30,
        asynchronous: false
    };
    /**
     * a Class for Eventable
     */
    function Base() {
    }
    // class Base {
    //     constructor() {
    //     }
    // }
    /**
     * EVENTS=[
     *  'add',
     *  'remove',
        'mousemove',
        'click',
        'mousedown',
        'mouseup',
        'dblclick',
        'contextmenu',
        'touchstart',
        'touchmove',
        'touchend',
        'mouseover',
        'mouseout',
        'idchange',
        'propertieschange',
        'show',
        'hide',
        'symbolchange'
         empty
    ];
     * This is the base class for all 3D objects
     *
     *
     * Its function and maptalks.geometry are as similar as possible
     *
     * maptalks.Eventable(Base) return a Class  https://github.com/maptalks/maptalks.js/blob/master/src/core/Eventable.js
     *
     */
    class BaseObject extends maptalks.Eventable(Base) {
        constructor(id) {
            super();
            this.isAdd = false;
            this._mouseover = false;
            this._visible = true;
            this._zoomVisible = true;
            this.picked = false;
            this.isBaseObject = true;
            if (id === undefined) {
                id = maptalks.Util.GUID();
            }
            this.id = id;
        }
        addTo(layer) {
            if (layer && layer.type === 'ThreeLayer') {
                layer.addMesh([this]);
            }
            else {
                console.error('layer only support maptalks.ThreeLayer');
            }
            return this;
        }
        remove() {
            const layer = this.getLayer();
            if (layer) {
                layer.removeMesh([this]);
            }
            return this;
        }
        getObject3d() {
            return this.object3d;
        }
        getId() {
            return this.id;
        }
        setId(id) {
            const oldId = this.getId();
            this.id = id;
            this._fire('idchange', {
                'old': oldId,
                'new': id,
                'target': this
            });
            return this;
        }
        getType() {
            return this.type;
        }
        getOptions() {
            return this.options;
        }
        getProperties() {
            return (this.options || {}).properties;
        }
        setProperties(property) {
            const old = Object.assign({}, this.getProperties());
            this.options.properties = property;
            this._fire('propertieschange', {
                'old': old,
                'new': property,
                'target': this
            });
            return this;
        }
        getLayer() {
            return this.options.layer;
        }
        // eslint-disable-next-line consistent-return
        getMap() {
            const layer = this.getLayer();
            if (layer) {
                return layer.getMap();
            }
        }
        // eslint-disable-next-line consistent-return
        getCenter() {
            const options = this.getOptions();
            const { coordinate, lineString, polygon } = options;
            if (coordinate) {
                return coordinate instanceof maptalks.Coordinate ? coordinate : new maptalks.Coordinate(coordinate);
            }
            else {
                const geometry = polygon || lineString;
                if (geometry && geometry.getCenter) {
                    return geometry.getCenter();
                }
            }
        }
        getAltitude() {
            return this.getOptions().altitude;
        }
        /**
         * Different objects need to implement their own methods
         * @param {*} altitude
         */
        setAltitude(altitude) {
            if (maptalks.Util.isNumber(altitude)) {
                const z = this.getLayer().distanceToVector3(altitude, altitude).x;
                this.getObject3d().position.z = z;
                this.options.altitude = altitude;
                if (this.pickObject3d) {
                    this.pickObject3d.position.z = z;
                }
                //fix merged mesh
                if (this._baseObjects && Array.isArray(this._baseObjects)) {
                    for (let i = 0, len = this._baseObjects.length; i < len; i++) {
                        if (this._baseObjects[i]) {
                            this._baseObjects[i].getObject3d().position.z = z;
                        }
                    }
                }
            }
            return this;
        }
        show() {
            //  in zoom range
            if (this._zoomVisible) {
                this.getObject3d().visible = true;
                this._fire('show');
            }
            this._visible = true;
            return this;
        }
        hide() {
            this.getObject3d().visible = false;
            this._fire('hide');
            this._visible = false;
            return this;
        }
        isVisible() {
            return (!!this.getObject3d().visible);
        }
        /**
         *  Different objects need to implement their own methods
         */
        getSymbol() {
            return this.getObject3d().material;
        }
        /**
         *  Different objects need to implement their own methods
         * @param {*} material
         */
        setSymbol(material) {
            if (material && material instanceof THREE.Material) {
                material.needsUpdate = true;
                material.vertexColors = this.getObject3d().material.vertexColors;
                const old = this.getObject3d().material.clone();
                this.getObject3d().material = material;
                this._fire('symbolchange', {
                    'old': old,
                    'new': material,
                    'target': this
                });
            }
            return this;
        }
        setInfoWindow(options) {
            this.removeInfoWindow();
            this.infoWindow = new maptalks.ui.InfoWindow(options);
            this.infoWindow.addTo(this);
            return this;
        }
        getInfoWindow() {
            return this.infoWindow;
        }
        openInfoWindow(coordinate) {
            coordinate = coordinate || this.getCenter();
            if (!(coordinate instanceof maptalks.Coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            // eslint-disable-next-line no-unused-expressions
            (coordinate && this.infoWindow && this.infoWindow.show(coordinate));
            return this;
        }
        closeInfoWindow() {
            // eslint-disable-next-line no-unused-expressions
            (this.infoWindow && this.infoWindow.hide());
            return this;
        }
        removeInfoWindow() {
            // eslint-disable-next-line no-unused-expressions
            if (this.infoWindow) {
                this.infoWindow.remove();
                delete this.infoWindow;
            }
            return this;
        }
        setToolTip(content, options) {
            this.removeToolTip();
            this.toolTip = new maptalks.ui.ToolTip(content, options);
            this.toolTip.addTo(this);
            return this;
        }
        getToolTip() {
            return this.toolTip;
        }
        openToolTip(coordinate) {
            coordinate = coordinate || this.getCenter();
            if (!(coordinate instanceof maptalks.Coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            // eslint-disable-next-line no-unused-expressions
            (coordinate && this.toolTip && this.toolTip.show(coordinate));
            return this;
        }
        closeToolTip() {
            // eslint-disable-next-line no-unused-expressions
            (this.toolTip && this.toolTip.hide());
            return this;
        }
        removeToolTip() {
            // eslint-disable-next-line no-unused-expressions
            if (this.toolTip) {
                this.toolTip.remove();
                delete this.toolTip;
            }
            return this;
        }
        /**
         * different components should implement their own animation methods
         * @param {*} options
         * @param {*} cb
         */
        // eslint-disable-next-line no-unused-vars
        animateShow(options = {}, cb) {
            if (this._showPlayer) {
                this._showPlayer.cancel();
            }
            if (maptalks.Util.isFunction(options)) {
                options = {};
                cb = options;
            }
            const duration = options['duration'] || 1000, easing = options['easing'] || 'out';
            const player = this._showPlayer = maptalks.animation.Animation.animate({
                'scale': 1
            }, {
                'duration': duration,
                'easing': easing
            }, frame => {
                const scale = frame.styles.scale;
                if (scale > 0) {
                    this.getObject3d().scale.set(1, 1, scale);
                }
                if (cb) {
                    cb(frame, scale);
                }
            });
            player.play();
            return player;
        }
        getMinZoom() {
            return this.getOptions().minZoom;
        }
        getMaxZoom() {
            return this.getOptions().maxZoom;
        }
        isAsynchronous() {
            return this.getOptions().asynchronous;
        }
        fire(eventType, param) {
            this._fire(eventType, param);
            if (this._vt && this._vt.onSelectMesh) {
                this._vt.onSelectMesh(eventType, param);
            }
            return this;
        }
        config() {
            return this;
        }
        setPickObject3d(object3d) {
            this.pickObject3d = object3d;
            this.pickObject3d['__parent'] = this;
            return this;
        }
        /**
         * more method support
         * @param {*} options
         */
        /**
         *
         * @param {*} options
         */
        _initOptions(options) {
            this.options = maptalks.Util.extend({}, OPTIONS, options);
            return this;
        }
        _createMesh(geometry, material) {
            this.object3d = new THREE.Mesh(geometry, material);
            this.object3d['__parent'] = this;
            return this;
        }
        _createGroup() {
            this.object3d = new THREE.Group();
            this.object3d['__parent'] = this;
            return this;
        }
        _createLine(geometry, material) {
            this.object3d = new THREE.Line(geometry, material);
            this.object3d.computeLineDistances();
            this.object3d['__parent'] = this;
            return this;
        }
        _createLine2(geometry, material) {
            this.object3d = new Line2(geometry, material);
            this.object3d.computeLineDistances();
            this.object3d['__parent'] = this;
            return this;
        }
        // eslint-disable-next-line no-unused-vars
        _createPoints(geometry, material) {
            //Serving for particles
            this.object3d = new THREE.Points(geometry, material);
            this.object3d['__parent'] = this;
            return this;
        }
        _createLineSegments(geometry, material) {
            this.object3d = new THREE.LineSegments(geometry, material);
            this.object3d.computeLineDistances();
            this.object3d['__parent'] = this;
            return this;
        }
    }

    function mergeBufferGeometries(geometries) {
        const { position, normal, uv, indices } = mergeBufferGeometriesAttribute(geometries);
        const bufferGeomertry = new THREE.BufferGeometry();
        const color = new Float32Array(position.length);
        color.fill(1, 0, position.length);
        addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
        addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(normal, 3));
        addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(position, 3));
        if (uv && uv.length) {
            addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(uv, 2));
        }
        bufferGeomertry.setIndex(new THREE.BufferAttribute(indices, 1));
        return bufferGeomertry;
    }
    function mergeBufferGeometriesAttribute(geometries) {
        const attributes = {}, attributesLen = {};
        for (let i = 0; i < geometries.length; ++i) {
            const geometry = geometries[i];
            for (const name in geometry) {
                if (attributes[name] === undefined) {
                    attributes[name] = [];
                    attributesLen[name] = 0;
                }
                attributes[name].push(geometry[name]);
                attributesLen[name] += geometry[name].length;
            }
        }
        // merge attributes
        const mergedGeometry = {};
        let indexOffset = 0;
        const mergedIndex = [];
        for (const name in attributes) {
            if (name === 'indices') {
                const indices = attributes[name];
                for (let i = 0, len = indices.length; i < len; i++) {
                    const index = indices[i];
                    for (let j = 0, len1 = index.length; j < len1; j++) {
                        mergedIndex.push(index[j] + indexOffset);
                    }
                    indexOffset += attributes['position'][i].length / 3;
                }
            }
            else {
                const mergedAttribute = mergeBufferAttributes(attributes[name], attributesLen[name]);
                if (!mergedAttribute)
                    return null;
                mergedGeometry[name] = mergedAttribute;
            }
        }
        mergedGeometry['indices'] = new Uint32Array(mergedIndex);
        return mergedGeometry;
    }
    function mergeBufferAttributes(attributes, arrayLength) {
        const array = new Float32Array(arrayLength);
        let offset = 0;
        for (let i = 0; i < attributes.length; ++i) {
            array.set(attributes[i], offset);
            offset += attributes[i].length;
        }
        return array;
    }
    function generateBufferGeometry(data) {
        //arraybuffer data
        const { position, normal, uv, indices } = data;
        const color = new Float32Array(position.length);
        color.fill(1, 0, position.length);
        const bufferGeomertry = new THREE.BufferGeometry();
        addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
        addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
        addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(new Float32Array(position), 3));
        addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
        bufferGeomertry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        return bufferGeomertry;
    }
    let defaultBufferGeometry;
    function getDefaultBufferGeometry() {
        if (!defaultBufferGeometry) {
            const SIZE = 0.000001;
            defaultBufferGeometry = new THREE.BoxBufferGeometry(SIZE, SIZE, SIZE);
        }
        return defaultBufferGeometry;
    }

    var MergeGeometryUtil = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mergeBufferGeometries: mergeBufferGeometries,
        mergeBufferGeometriesAttribute: mergeBufferGeometriesAttribute,
        generateBufferGeometry: generateBufferGeometry,
        getDefaultBufferGeometry: getDefaultBufferGeometry
    });

    const barGeometryCache = {};
    const defaultBoxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
    defaultBoxGeometry.translate(0, 0, 0.5);
    const topColor = new THREE.Color('#fff'), bottomColor = new THREE.Color('#fff');
    function getDefaultCylinderBufferGeometry(radialSegments = 6) {
        if (!barGeometryCache[radialSegments]) {
            const geometry = new THREE.CylinderBufferGeometry(1, 1, 1, radialSegments, 1);
            geometry.rotateX(Math.PI / 2);
            geometry.translate(0, 0, 0.5);
            geometry.rotateZ(Math.PI / 6);
            barGeometryCache[radialSegments] = geometry;
        }
        return barGeometryCache[radialSegments];
    }
    /**
     * Reuse Geometry   , Meter as unit
     * @param {*} property
     */
    // eslint-disable-next-line no-unused-vars
    function getGeometry(property) {
        const { height, radialSegments, radius } = property;
        const geometry = getDefaultCylinderBufferGeometry(radialSegments).clone();
        geometry.scale(radius, radius, height);
        return geometry;
    }
    /**
     * init Colors
     * @param {*} geometry
     * @param {*} color
     * @param {*} _topColor
     */
    function initVertexColors(geometry, color, _topColor, key = 'y', v = 0) {
        let offset = 0;
        if (key === 'y') {
            offset = 1;
        }
        else if (key === 'z') {
            offset = 2;
        }
        const position = geometry.attributes.position.array;
        const len = position.length;
        bottomColor.setStyle(color);
        topColor.setStyle(_topColor);
        const colors = [];
        for (let i = 0; i < len; i += 3) {
            const y = position[i + offset];
            if (y > v) {
                colors.push(topColor.r, topColor.g, topColor.b);
            }
            else {
                colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
            }
        }
        addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
        return colors;
    }
    function mergeBarGeometry(geometries) {
        const attributes = [], colors = [];
        for (let i = 0, len = geometries.length; i < len; i++) {
            const { color, normal, position, uv } = geometries[i].attributes;
            const index = geometries[i].index;
            if (color) {
                for (let j = 0, len1 = color.array.length; j < len1; j++) {
                    colors.push(color.array[j]);
                }
            }
            attributes.push({
                // color: color.array,
                normal: normal.array,
                uv: uv.array,
                position: position.array,
                indices: index.array
            });
        }
        const bufferGeometry = mergeBufferGeometries(attributes);
        if (colors.length) {
            addAttribute(bufferGeometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
            // for (let i = 0, len = colors.length; i < len; i++) {
            //     bufferGeometry.attributes.color.array[i] = colors[i];
            // }
        }
        for (let i = 0, len = geometries.length; i < len; i++) {
            geometries[i].dispose();
        }
        return bufferGeometry;
    }
    function getDefaultBoxGeometry() {
        return defaultBoxGeometry;
    }

    const OPTIONS$1 = {
        radius: 10,
        height: 100,
        radialSegments: 6,
        altitude: 0,
        topColor: '',
        bottomColor: '#2d2f61',
    };
    /**
     *
     */
    class Bar extends BaseObject {
        constructor(coordinate, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$1, options, { layer, coordinate });
            super();
            this._initOptions(options);
            const { height, radius, topColor, bottomColor, altitude } = options;
            options.height = layer.distanceToVector3(height, height).x;
            options.radius = layer.distanceToVector3(radius, radius).x;
            // Meter as unit
            options['_radius'] = this.options['radius'];
            options['_height'] = this.options['height'];
            const geometry = getGeometry(options);
            if (topColor) {
                initVertexColors(geometry, bottomColor, topColor, 'z', options.height / 2);
                material.vertexColors = getVertexColors();
            }
            this._createMesh(geometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const position = layer.coordinateToVector3(coordinate, z);
            this.getObject3d().position.copy(position);
            this.type = 'Bar';
        }
    }

    //Using cache to reduce computation
    function distanceToVector3(distance, layer, cache = {}) {
        if (cache[distance] === undefined) {
            cache[distance] = layer.distanceToVector3(distance, distance).x;
        }
        return cache[distance];
    }
    /**
     *Get the center point of the point set
     * @param {*} coordinates
     */
    function getCenterOfPoints(coordinates = []) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const { coordinate, lnglat, lnglats, xy, xys } = coordinates[i];
            const c = coordinate || lnglat || lnglats || xy || xys || coordinates[i];
            let x, y;
            if (Array.isArray(c)) {
                x = c[0];
                y = c[1];
            }
            else if (c instanceof maptalks.Coordinate) {
                x = c.x;
                y = c.y;
            }
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        return new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
    }
    function setBottomHeight(geometry, bottomHeight, layer, cache) {
        if (bottomHeight === undefined || typeof bottomHeight !== 'number' || bottomHeight === 0) {
            return 0;
        }
        let position;
        if (geometry instanceof THREE.BufferGeometry) {
            position = geometry.attributes.position.array;
        }
        else if (Array.isArray(geometry)) {
            position = geometry;
        }
        else {
            position = geometry.position;
        }
        let h = 0;
        if (position) {
            if (cache) {
                if (cache[bottomHeight] === undefined) {
                    cache[bottomHeight] = layer.distanceToVector3(bottomHeight, bottomHeight).x;
                }
                h = cache[bottomHeight];
            }
            else {
                h = layer.distanceToVector3(bottomHeight, bottomHeight).x;
            }
            const len = position.length;
            if (position[0] instanceof THREE.Vector3) {
                for (let i = 0; i < len; i++) {
                    position[i].z += h;
                }
            }
            else {
                for (let i = 0; i < len; i += 3) {
                    position[i + 2] += h;
                }
            }
        }
        return h;
    }

    var earcut_1 = earcut;
    var default_1 = earcut;

    function earcut(data, holeIndices, dim) {

        dim = dim || 2;

        var hasHoles = holeIndices && holeIndices.length,
            outerLen = hasHoles ? holeIndices[0] * dim : data.length,
            outerNode = linkedList(data, 0, outerLen, dim, true),
            triangles = [];

        if (!outerNode || outerNode.next === outerNode.prev) return triangles;

        var minX, minY, maxX, maxY, x, y, invSize;

        if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];

            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }

            // minX, minY and invSize are later used to transform coords into integers for z-order calculation
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 1 / invSize : 0;
        }

        earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

        return triangles;
    }

    // create a circular doubly linked list from polygon points in the specified winding order
    function linkedList(data, start, end, dim, clockwise) {
        var i, last;

        if (clockwise === (signedArea(data, start, end, dim) > 0)) {
            for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
        } else {
            for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
        }

        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }

        return last;
    }

    // eliminate colinear or duplicate points
    function filterPoints(start, end) {
        if (!start) return start;
        if (!end) end = start;

        var p = start,
            again;
        do {
            again = false;

            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) break;
                again = true;

            } else {
                p = p.next;
            }
        } while (again || p !== end);

        return end;
    }

    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) return;

        // interlink polygon nodes in z-order
        if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

        var stop = ear,
            prev, next;

        // iterate through ears, slicing them one by one
        while (ear.prev !== ear.next) {
            prev = ear.prev;
            next = ear.next;

            if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
                // cut off the triangle
                triangles.push(prev.i / dim);
                triangles.push(ear.i / dim);
                triangles.push(next.i / dim);

                removeNode(ear);

                // skipping the next vertex leads to less sliver triangles
                ear = next.next;
                stop = next.next;

                continue;
            }

            ear = next;

            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {
                // try filtering points and slicing again
                if (!pass) {
                    earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

                // if this didn't work, try curing all small self-intersections locally
                } else if (pass === 1) {
                    ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

                // as a last resort, try splitting the remaining polygon into two
                } else if (pass === 2) {
                    splitEarcut(ear, triangles, dim, minX, minY, invSize);
                }

                break;
            }
        }
    }

    // check whether a polygon node forms a valid ear with adjacent nodes
    function isEar(ear) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // now make sure we don't have other points inside the potential ear
        var p = ear.next.next;

        while (p !== ear.prev) {
            if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.next;
        }

        return true;
    }

    function isEarHashed(ear, minX, minY, invSize) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // triangle bbox; min & max are calculated like this for speed
        var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
            minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
            maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
            maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

        // z-order range for the current triangle bbox;
        var minZ = zOrder(minTX, minTY, minX, minY, invSize),
            maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

        var p = ear.prevZ,
            n = ear.nextZ;

        // look for points inside the triangle in both directions
        while (p && p.z >= minZ && n && n.z <= maxZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;

            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;
        }

        // look for remaining points in decreasing z-order
        while (p && p.z >= minZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;
        }

        // look for remaining points in increasing z-order
        while (n && n.z <= maxZ) {
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;
        }

        return true;
    }

    // go through all polygon nodes and cure small local self-intersections
    function cureLocalIntersections(start, triangles, dim) {
        var p = start;
        do {
            var a = p.prev,
                b = p.next.next;

            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

                triangles.push(a.i / dim);
                triangles.push(p.i / dim);
                triangles.push(b.i / dim);

                // remove two nodes involved
                removeNode(p);
                removeNode(p.next);

                p = start = b;
            }
            p = p.next;
        } while (p !== start);

        return filterPoints(p);
    }

    // try splitting polygon into two and triangulate them independently
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {
        // look for a valid diagonal that divides the polygon into two
        var a = start;
        do {
            var b = a.next.next;
            while (b !== a.prev) {
                if (a.i !== b.i && isValidDiagonal(a, b)) {
                    // split the polygon in two by the diagonal
                    var c = splitPolygon(a, b);

                    // filter colinear points around the cuts
                    a = filterPoints(a, a.next);
                    c = filterPoints(c, c.next);

                    // run earcut on each half
                    earcutLinked(a, triangles, dim, minX, minY, invSize);
                    earcutLinked(c, triangles, dim, minX, minY, invSize);
                    return;
                }
                b = b.next;
            }
            a = a.next;
        } while (a !== start);
    }

    // link every hole into the outer loop, producing a single-ring polygon without holes
    function eliminateHoles(data, holeIndices, outerNode, dim) {
        var queue = [],
            i, len, start, end, list;

        for (i = 0, len = holeIndices.length; i < len; i++) {
            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) list.steiner = true;
            queue.push(getLeftmost(list));
        }

        queue.sort(compareX);

        // process holes from left to right
        for (i = 0; i < queue.length; i++) {
            eliminateHole(queue[i], outerNode);
            outerNode = filterPoints(outerNode, outerNode.next);
        }

        return outerNode;
    }

    function compareX(a, b) {
        return a.x - b.x;
    }

    // find a bridge between vertices that connects hole with an outer ring and and link it
    function eliminateHole(hole, outerNode) {
        outerNode = findHoleBridge(hole, outerNode);
        if (outerNode) {
            var b = splitPolygon(outerNode, hole);

            // filter collinear points around the cuts
            filterPoints(outerNode, outerNode.next);
            filterPoints(b, b.next);
        }
    }

    // David Eberly's algorithm for finding a bridge between hole and outer polygon
    function findHoleBridge(hole, outerNode) {
        var p = outerNode,
            hx = hole.x,
            hy = hole.y,
            qx = -Infinity,
            m;

        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {
            if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
                var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    if (x === hx) {
                        if (hy === p.y) return p;
                        if (hy === p.next.y) return p.next;
                    }
                    m = p.x < p.next.x ? p : p.next;
                }
            }
            p = p.next;
        } while (p !== outerNode);

        if (!m) return null;

        if (hx === qx) return m; // hole touches outer segment; pick leftmost endpoint

        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point

        var stop = m,
            mx = m.x,
            my = m.y,
            tanMin = Infinity,
            tan;

        p = m;

        do {
            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                    pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

                if (locallyInside(p, hole) &&
                    (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                    m = p;
                    tanMin = tan;
                }
            }

            p = p.next;
        } while (p !== stop);

        return m;
    }

    // whether sector in vertex m contains sector in vertex p in the same coordinates
    function sectorContainsSector(m, p) {
        return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
    }

    // interlink polygon nodes in z-order
    function indexCurve(start, minX, minY, invSize) {
        var p = start;
        do {
            if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;
        } while (p !== start);

        p.prevZ.nextZ = null;
        p.prevZ = null;

        sortLinked(p);
    }

    // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
    function sortLinked(list) {
        var i, p, q, e, tail, numMerges, pSize, qSize,
            inSize = 1;

        do {
            p = list;
            list = null;
            tail = null;
            numMerges = 0;

            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q) break;
                }
                qSize = inSize;

                while (pSize > 0 || (qSize > 0 && q)) {

                    if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    } else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }

                    if (tail) tail.nextZ = e;
                    else list = e;

                    e.prevZ = tail;
                    tail = e;
                }

                p = q;
            }

            tail.nextZ = null;
            inSize *= 2;

        } while (numMerges > 1);

        return list;
    }

    // z-order of a point given coords and inverse of the longer side of data bbox
    function zOrder(x, y, minX, minY, invSize) {
        // coords are transformed into non-negative 15-bit integer range
        x = 32767 * (x - minX) * invSize;
        y = 32767 * (y - minY) * invSize;

        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;

        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;

        return x | (y << 1);
    }

    // find the leftmost node of a polygon ring
    function getLeftmost(start) {
        var p = start,
            leftmost = start;
        do {
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
            p = p.next;
        } while (p !== start);

        return leftmost;
    }

    // check if a point lies within a convex triangle
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
               (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
               (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }

    // check if a diagonal between two polygon nodes is valid (lies in polygon interior)
    function isValidDiagonal(a, b) {
        return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
               (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
                (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
                equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
    }

    // signed area of a triangle
    function area(p, q, r) {
        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }

    // check if two points are equal
    function equals(p1, p2) {
        return p1.x === p2.x && p1.y === p2.y;
    }

    // check if two segments intersect
    function intersects(p1, q1, p2, q2) {
        var o1 = sign(area(p1, q1, p2));
        var o2 = sign(area(p1, q1, q2));
        var o3 = sign(area(p2, q2, p1));
        var o4 = sign(area(p2, q2, q1));

        if (o1 !== o2 && o3 !== o4) return true; // general case

        if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
        if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
        if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
        if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

        return false;
    }

    // for collinear points p, q, r, check if point q lies on segment pr
    function onSegment(p, q, r) {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }

    function sign(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0;
    }

    // check if a polygon diagonal intersects any polygon segments
    function intersectsPolygon(a, b) {
        var p = a;
        do {
            if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                    intersects(p, p.next, a, b)) return true;
            p = p.next;
        } while (p !== a);

        return false;
    }

    // check if a polygon diagonal is locally inside the polygon
    function locallyInside(a, b) {
        return area(a.prev, a, a.next) < 0 ?
            area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
            area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }

    // check if the middle point of a polygon diagonal is inside the polygon
    function middleInside(a, b) {
        var p = a,
            inside = false,
            px = (a.x + b.x) / 2,
            py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                    (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
                inside = !inside;
            p = p.next;
        } while (p !== a);

        return inside;
    }

    // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring
    function splitPolygon(a, b) {
        var a2 = new Node(a.i, a.x, a.y),
            b2 = new Node(b.i, b.x, b.y),
            an = a.next,
            bp = b.prev;

        a.next = b;
        b.prev = a;

        a2.next = an;
        an.prev = a2;

        b2.next = a2;
        a2.prev = b2;

        bp.next = b2;
        b2.prev = bp;

        return b2;
    }

    // create a node and optionally link it with previous one (in a circular doubly linked list)
    function insertNode(i, x, y, last) {
        var p = new Node(i, x, y);

        if (!last) {
            p.prev = p;
            p.next = p;

        } else {
            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;
        }
        return p;
    }

    function removeNode(p) {
        p.next.prev = p.prev;
        p.prev.next = p.next;

        if (p.prevZ) p.prevZ.nextZ = p.nextZ;
        if (p.nextZ) p.nextZ.prevZ = p.prevZ;
    }

    function Node(i, x, y) {
        // vertex index in coordinates array
        this.i = i;

        // vertex coordinates
        this.x = x;
        this.y = y;

        // previous and next vertex nodes in a polygon ring
        this.prev = null;
        this.next = null;

        // z-order curve value
        this.z = null;

        // previous and next nodes in z-order
        this.prevZ = null;
        this.nextZ = null;

        // indicates whether this is a steiner point
        this.steiner = false;
    }

    // return a percentage difference between the polygon area and its triangulation area;
    // used to verify correctness of triangulation
    earcut.deviation = function (data, holeIndices, dim, triangles) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
            for (var i = 0, len = holeIndices.length; i < len; i++) {
                var start = holeIndices[i] * dim;
                var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
                polygonArea -= Math.abs(signedArea(data, start, end, dim));
            }
        }

        var trianglesArea = 0;
        for (i = 0; i < triangles.length; i += 3) {
            var a = triangles[i] * dim;
            var b = triangles[i + 1] * dim;
            var c = triangles[i + 2] * dim;
            trianglesArea += Math.abs(
                (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
                (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
        }

        return polygonArea === 0 && trianglesArea === 0 ? 0 :
            Math.abs((trianglesArea - polygonArea) / polygonArea);
    };

    function signedArea(data, start, end, dim) {
        var sum = 0;
        for (var i = start, j = end - dim; i < end; i += dim) {
            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;
        }
        return sum;
    }

    // turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
    earcut.flatten = function (data) {
        var dim = data[0][0].length,
            result = {vertices: [], holes: [], dimensions: dim},
            holeIndex = 0;

        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };
    earcut_1.default = default_1;

    /*
     (c) 2017, Vladimir Agafonkin
     Simplify.js, a high-performance JS polyline simplification library
     mourner.github.io/simplify-js
    */

    // to suit your point format, run search/replace for '.x' and '.y';
    // for 3D version, see 3d branch (configurability would draw significant performance overhead)

    // square distance between 2 points
    function getSqDist(p1, p2) {

        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1];

        return dx * dx + dy * dy;
    }

    // square distance from a point to a segment
    function getSqSegDist(p, p1, p2) {

        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y;

        if (dx !== 0 || dy !== 0) {

            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2[0];
                y = p2[1];

            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p[0] - x;
        dy = p[1] - y;

        return dx * dx + dy * dy;
    }
    // rest of the code doesn't care about point format

    // basic distance-based simplification
    function simplifyRadialDist(points, sqTolerance) {

        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;

        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];

            if (getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) newPoints.push(point);

        return newPoints;
    }

    function simplifyDPStep(points, first, last, sqTolerance, simplified) {
        var maxSqDist = sqTolerance,
            index;

        for (var i = first + 1; i < last; i++) {
            var sqDist = getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }

    // simplification using Ramer-Douglas-Peucker algorithm
    function simplifyDouglasPeucker(points, sqTolerance) {
        var last = points.length - 1;

        var simplified = [points[0]];
        simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);

        return simplified;
    }

    // both algorithms combined for awesome performance
    function simplify(points, tolerance, highestQuality) {

        if (points.length <= 2) return points;

        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

        points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
        points = simplifyDouglasPeucker(points, sqTolerance);

        return points;
    }

    function dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    }
    function v2Dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1];
    }

    function normalize(out, v) {
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const d = Math.sqrt(x * x + y * y + z * z);
        out[0] = x / d;
        out[1] = y / d;
        out[2] = z / d;
        return out;
    }

    function v2Normalize(out, v) {
        const x = v[0];
        const y = v[1];
        const d = Math.sqrt(x * x + y * y);
        out[0] = x / d;
        out[1] = y / d;
        return out;
    }

    function scale(out, v, s) {
        out[0] = v[0] * s;
        out[1] = v[1] * s;
        out[2] = v[2] * s;
        return out;
    }

    function scaleAndAdd(out, v1, v2, s) {
        out[0] = v1[0] + v2[0] * s;
        out[1] = v1[1] + v2[1] * s;
        out[2] = v1[2] + v2[2] * s;
        return out;
    }

    function v2Add(out, v1, v2) {
        out[0] = v1[0] + v2[0];
        out[1] = v1[1] + v2[1];
        return out;
    }

    function v3Sub(out, v1, v2) {
        out[0] = v1[0] - v2[0];
        out[1] = v1[1] - v2[1];
        out[2] = v1[2] - v2[2];
        return out;
    }

    function v3Normalize(out, v) {
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const d = Math.sqrt(x * x + y * y + z * z);
        out[0] = x / d;
        out[1] = y / d;
        out[2] = z / d;
        return out;
    }

    function v3Cross(out, v1, v2) {
        var ax = v1[0], ay = v1[1], az = v1[2],
            bx = v2[0], by = v2[1], bz = v2[2];

        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;
        return out;
    }

    const rel = [];
    // start and end must be normalized
    function slerp(out, start, end, t) {
        // https://keithmaggio.wordpress.com/2011/02/15/math-magician-lerp-slerp-and-nlerp/
        const cosT = dot(start, end);
        const theta = Math.acos(cosT) * t;

        scaleAndAdd(rel, end, start, -cosT);
        normalize(rel, rel);// start and rel Orthonormal basis

        scale(out, start, Math.cos(theta));
        scaleAndAdd(out, out, rel, Math.sin(theta));

        return out;
    }

    function area$1(points, start, end) {
        // Signed polygon area
        const n = end - start;
        if (n < 3) {
            return 0;
        }
        let area = 0;
        for (let i = (end - 1) * 2, j = start * 2; j < end * 2;) {
            const x0 = points[i];
            const y0 = points[i + 1];
            const x1 = points[j];
            const y1 = points[j + 1];
            i = j;
            j += 2;
            area += x0 * y1 - x1 * y0;
        }

        return area;
    }

    // TODO fitRect x, y are negative?

    function triangulate(vertices, holes, dimensions=2) {
        return earcut_1(vertices, holes, dimensions);
    }
    function flatten(data) {
        return earcut_1.flatten(data);
    }

    const v1 = [];
    const v2 = [];
    const v = [];

    function innerOffsetPolygon(
        vertices, out, start, end, outStart, offset, miterLimit, close
    ) {
        const checkMiterLimit = miterLimit != null;
        let outOff = outStart;
        let indicesMap = null;
        if (checkMiterLimit) {
            indicesMap = new Uint32Array(end - start);
        }
        for (let i = start; i < end; i++) {
            const nextIdx = i === end - 1 ? start : i + 1;
            const prevIdx = i === start ? end - 1 : i - 1;
            const x1 = vertices[prevIdx * 2];
            const y1 = vertices[prevIdx * 2 + 1];
            const x2 = vertices[i * 2];
            const y2 = vertices[i * 2 + 1];
            const x3 = vertices[nextIdx * 2];
            const y3 = vertices[nextIdx * 2 + 1];

            v1[0] = x2 - x1;
            v1[1] = y2 - y1;
            v2[0] = x3 - x2;
            v2[1] = y3 - y2;

            v2Normalize(v1, v1);
            v2Normalize(v2, v2);

            checkMiterLimit && (indicesMap[i] = outOff);
            if (!close && i === start) {
                v[0] = v2[1];
                v[1] = -v2[0];
                v2Normalize(v, v);
                out[outOff * 2] = x2 + v[0] * offset;
                out[outOff * 2 + 1] = y2 + v[1] * offset;
                outOff++;
            }
            else if (!close && i === end - 1) {
                v[0] = v1[1];
                v[1] = -v1[0];
                v2Normalize(v, v);
                out[outOff * 2] = x2 + v[0] * offset;
                out[outOff * 2 + 1] = y2 + v[1] * offset;
                outOff++;
            }
            else {
                // PENDING Why using sub will lost the direction info.
                v2Add(v, v2, v1);
                const tmp = v[1];
                v[1] = -v[0];
                v[0] = tmp;

                v2Normalize(v, v);

                const cosA = v2Dot(v, v2);
                const sinA = Math.sqrt(1 - cosA * cosA);
                // PENDING
                const miter = offset * Math.min(10, 1 / sinA);

                const isCovex = offset * cosA < 0;

                if (checkMiterLimit && (1 / sinA) > miterLimit && isCovex) {
                    const mx = x2 + v[0] * offset;
                    const my = y2 + v[1] * offset;
                    const halfA = Math.acos(sinA) / 2;
                    const dist = Math.tan(halfA) * Math.abs(offset);
                    out[outOff * 2] = mx + v[1] * dist;
                    out[outOff * 2 + 1] = my - v[0] * dist;
                    outOff++;
                    out[outOff * 2] = mx - v[1] * dist;
                    out[outOff * 2 + 1] = my + v[0] * dist;
                    outOff++;
                }
                else {
                    out[outOff * 2] = x2 + v[0] * miter;
                    out[outOff * 2 + 1] = y2 + v[1] * miter;
                    outOff++;
                }
            }
        }

        return indicesMap;
    }

    function offsetPolygon(vertices, holes, offset, miterLimit, close) {
        const offsetVertices = miterLimit != null ? [] : new Float32Array(vertices.length);
        const exteriorSize = (holes && holes.length) ? holes[0] : vertices.length / 2;

        innerOffsetPolygon(
            vertices, offsetVertices, 0, exteriorSize, 0, offset, miterLimit, close);

        if (holes) {
            for (let i = 0; i < holes.length; i++) {
                const start = holes[i];
                const end = holes[i + 1] || vertices.length / 2;
                innerOffsetPolygon(
                    vertices, offsetVertices, start, end,
                    miterLimit != null ? offsetVertices.length / 2 : start,
                    offset, miterLimit, close
                );
            }
        }

        return offsetVertices;
    }

    function reversePoints(points, stride, start, end) {
        for (let i = 0; i < Math.floor((end - start) / 2); i++) {
            for (let j = 0; j < stride; j++) {
                const a = (i + start) * stride + j;
                const b = (end - i - 1) * stride + j;
                const tmp = points[a];
                points[a] = points[b];
                points[b] = tmp;
            }
        }

        return points;
    }

    function convertToClockwise(vertices, holes) {
        let polygonVertexCount = vertices.length / 2;
        let start = 0;
        let end = holes && holes.length ? holes[0] : polygonVertexCount;
        if (area$1(vertices, start, end) > 0) {
            reversePoints(vertices, 2, start, end);
        }
        for (let h = 1; h < (holes ? holes.length : 0) + 1; h++) {
            start = holes[h - 1];
            end = holes[h] || polygonVertexCount;
            if (area$1(vertices, start, end) < 0) {
                reversePoints(vertices, 2, start, end);
            }
        }
    }

    function normalizeOpts(opts) {

        opts.depth = opts.depth || 1;
        opts.bevelSize = opts.bevelSize || 0;
        opts.bevelSegments = opts.bevelSegments == null ? 2 : opts.bevelSegments;
        opts.smoothSide = opts.smoothSide || false;
        opts.smoothBevel = opts.smoothBevel || false;
        opts.simplify = opts.simplify || 0;

        // Normalize bevel options.
        if (typeof opts.depth === 'number') {
            opts.bevelSize = Math.min(!(opts.bevelSegments > 0) ? 0 : opts.bevelSize, opts.depth / 2);
        }
        if (!(opts.bevelSize > 0)) {
            opts.bevelSegments = 0;
        }
        opts.bevelSegments = Math.round(opts.bevelSegments);

        const boundingRect = opts.boundingRect;
        opts.translate = opts.translate || [0, 0];
        opts.scale = opts.scale || [1, 1];
        if (opts.fitRect) {
            let targetX = opts.fitRect.x == null
                ? (boundingRect.x || 0)
                : opts.fitRect.x;
            let targetY = opts.fitRect.y == null
                ? (boundingRect.y || 0)
                : opts.fitRect.y;
            let targetWidth = opts.fitRect.width;
            let targetHeight = opts.fitRect.height;
            if (targetWidth == null) {
                if (targetHeight != null) {
                    targetWidth = targetHeight / boundingRect.height * boundingRect.width;
                }
                else {
                    targetWidth = boundingRect.width;
                    targetHeight = boundingRect.height;
                }
            }
            else if (targetHeight == null) {
                targetHeight = targetWidth / boundingRect.width * boundingRect.height;
            }
            opts.scale = [
                targetWidth / boundingRect.width,
                targetHeight / boundingRect.height
            ];
            opts.translate = [
                (targetX - boundingRect.x) * opts.scale[0],
                (targetY - boundingRect.y) * opts.scale[1]
            ];
        }
    }

    function generateNormal(indices, position) {

        function v3Set(p, a, b, c) {
            p[0] = a; p[1] = b; p[2] = c;
        }

        const p1 = [];
        const p2 = [];
        const p3 = [];

        const v21 = [];
        const v32 = [];

        const n = [];

        const len = indices.length;
        const normals = new Float32Array(position.length);
        for (let f = 0; f < len;) {
            const i1 = indices[f++] * 3;
            const i2 = indices[f++] * 3;
            const i3 = indices[f++] * 3;

            v3Set(p1, position[i1], position[i1 + 1], position[i1 + 2]);
            v3Set(p2, position[i2], position[i2 + 1], position[i2 + 2]);
            v3Set(p3, position[i3], position[i3 + 1], position[i3 + 2]);

            v3Sub(v21, p1, p2);
            v3Sub(v32, p2, p3);
            v3Cross(n, v21, v32);
            // Already be weighted by the triangle area
            for (let i = 0; i < 3; i++) {
                normals[i1 + i] = normals[i1 + i] + n[i];
                normals[i2 + i] = normals[i2 + i] + n[i];
                normals[i3 + i] = normals[i3 + i] + n[i];
            }
        }

        for (var i = 0; i < normals.length;) {
            v3Set(n, normals[i], normals[i+1], normals[i+2]);
            v3Normalize(n, n);
            normals[i++] = n[0];
            normals[i++] = n[1];
            normals[i++] = n[2];
        }

        return normals;
    }
    // 0,0----1,0
    // 0,1----1,1
    const quadToTriangle = [
        [0, 0], [1, 0], [1, 1],
        [0, 0], [1, 1], [0, 1]
    ];

    // Add side vertices and indices. Include bevel.
    function addExtrudeSide(
        out, {vertices, topVertices, depth, rect}, start, end,
        cursors, opts
    ) {
        const ringVertexCount = end - start;
        const splitSide = opts.smoothSide ? 1 : 2;
        const splitRingVertexCount = ringVertexCount * splitSide;

        const splitBevel = opts.smoothBevel ? 1 : 2;
        const bevelSize = Math.min(depth / 2, opts.bevelSize);
        const bevelSegments = opts.bevelSegments;
        const vertexOffset = cursors.vertex;
        const size = Math.max(rect.width, rect.height, depth);

        // Side vertices
        if (bevelSize > 0) {

            const v0 = [0, 0, 1];
            const v1 = [];
            const v2 = [0, 0, -1];
            const v = [];

            let ringCount = 0;
            let vLen = new Float32Array(ringVertexCount);
            for (let k = 0; k < 2; k++) {
                const z = (k === 0 ? (depth - bevelSize) : bevelSize);
                for (let s = 0; s <= bevelSegments * splitBevel; s++) {
                    let uLen = 0;
                    let prevX;
                    let prevY;
                    for (let i = 0; i < ringVertexCount; i++) {

                        for (let j = 0; j < splitSide; j++) {
                            // TODO Cache and optimize
                            let idx = ((i + j) % ringVertexCount + start) * 2;
                            v1[0] = vertices[idx] - topVertices[idx];
                            v1[1] = vertices[idx + 1] - topVertices[idx + 1];
                            v1[2] = 0;
                            const l = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
                            v1[0] /= l;
                            v1[1] /= l;

                            const t = (Math.floor(s / splitBevel) + (s % splitBevel)) / bevelSegments;
                            k === 0 ? slerp(v, v0, v1, t)
                                : slerp(v, v1, v2, t);

                            const t2 = k === 0  ? t : 1 - t;
                            const a = bevelSize * Math.sin(t2 * Math.PI / 2);
                            const b = l * Math.cos(t2 * Math.PI / 2);

                            // ellipse radius
                            const r = bevelSize * l / Math.sqrt(a * a + b * b);

                            const x = v[0] * r + topVertices[idx];
                            const y = v[1] * r + topVertices[idx + 1];
                            const zz = v[2] * r + z;
                            out.position[cursors.vertex * 3] = x;
                            out.position[cursors.vertex * 3 + 1] = y;
                            out.position[cursors.vertex * 3 + 2] = zz;

                            // TODO Cache and optimize
                            if (i > 0 || j > 0) {
                                uLen += Math.sqrt((prevX - x) * (prevX - x) + (prevY - y) * (prevY - y));
                            }
                            if (s > 0 || k > 0) {
                                let tmp = (cursors.vertex - splitRingVertexCount) * 3;
                                let prevX2 = out.position[tmp];
                                let prevY2 = out.position[tmp + 1];
                                let prevZ2 = out.position[tmp + 2];

                                vLen[i] += Math.sqrt(
                                    (prevX2 - x) * (prevX2 - x)
                                    + (prevY2 - y) * (prevY2 - y)
                                    + (prevZ2 - zz) * (prevZ2 - zz)
                                );
                            }
                            out.uv[cursors.vertex * 2] = uLen / size;
                            out.uv[cursors.vertex * 2 + 1] = vLen[i] / size;

                            prevX = x;
                            prevY = y;
                            cursors.vertex++;
                        }

                        if ((splitBevel > 1 && (s % splitBevel)) || (splitBevel === 1 && s >= 1)) {
                            for (let f = 0; f < 6; f++) {
                                const m = (quadToTriangle[f][0] + i * splitSide) % splitRingVertexCount;
                                const n = quadToTriangle[f][1] + ringCount;
                                out.indices[cursors.index++] = (n - 1) * splitRingVertexCount + m + vertexOffset;
                            }
                        }
                    }

                    ringCount++;
                }
            }
        }
        else {
            for (let k = 0; k < 2; k++) {
                const z = k === 0 ? depth - bevelSize : bevelSize;
                let uLen = 0;
                let prevX;
                let prevY;
                for (let i = 0; i < ringVertexCount; i++) {
                    for (let m = 0; m < splitSide; m++) {
                        const idx = ((i + m) % ringVertexCount + start) * 2;
                        const x = vertices[idx];
                        const y = vertices[idx + 1];
                        out.position[cursors.vertex * 3] = x;
                        out.position[cursors.vertex * 3 + 1] = y;
                        out.position[cursors.vertex * 3 + 2] = z;
                        if (i > 0 || m > 0) {
                            uLen += Math.sqrt((prevX - x) * (prevX - x) + (prevY - y) * (prevY - y));
                        }
                        out.uv[cursors.vertex * 2] = uLen / size;
                        out.uv[cursors.vertex * 2 + 1] = z / size;
                        prevX = x;
                        prevY = y;

                        cursors.vertex++;
                    }
                }
            }
        }
        // Connect the side
        const sideStartRingN = bevelSize > 0 ? (bevelSegments * splitBevel + 1) : 1;
        for (let i = 0; i < ringVertexCount; i++) {
            for (let f = 0; f < 6; f++) {
                const m = (quadToTriangle[f][0] + i * splitSide) % splitRingVertexCount;
                const n = quadToTriangle[f][1] + sideStartRingN;
                out.indices[cursors.index++] = (n - 1) * splitRingVertexCount + m + vertexOffset;
            }
        }
    }

    function addTopAndBottom({indices, vertices, topVertices, rect, depth}, out, cursors, opts) {
        if (vertices.length <= 4) {
            return;
        }

        const vertexOffset = cursors.vertex;
        // Top indices
        const indicesLen = indices.length;
        for (let i = 0; i < indicesLen; i++) {
            out.indices[cursors.index++] = vertexOffset + indices[i];
        }
        const size = Math.max(rect.width, rect.height);
        // Top and bottom vertices
        for (let k = 0; k < (opts.excludeBottom ? 1 : 2); k++) {
            for (let i = 0; i < topVertices.length; i += 2) {
                const x = topVertices[i];
                const y = topVertices[i + 1];
                out.position[cursors.vertex * 3] = x;
                out.position[cursors.vertex * 3 + 1] = y;
                out.position[cursors.vertex * 3 + 2] = (1 - k) * depth;

                out.uv[cursors.vertex * 2] = (x - rect.x) / size;
                out.uv[cursors.vertex * 2 + 1] = (y - rect.y) / size;
                cursors.vertex++;
            }
        }
        // Bottom indices
        if (!opts.excludeBottom) {
            const vertexCount = vertices.length / 2;
            for (let i = 0; i < indicesLen; i += 3) {
                for (let k = 0; k < 3; k++) {
                    out.indices[cursors.index++] = vertexOffset + vertexCount + indices[i + 2 - k];
                }
            }
        }
    }


    function innerExtrudeTriangulatedPolygon(preparedData, opts) {
        let indexCount = 0;
        let vertexCount = 0;

        for (let p = 0; p < preparedData.length; p++) {
            const {indices, vertices, holes, depth} = preparedData[p];
            const polygonVertexCount = vertices.length / 2;
            const bevelSize = Math.min(depth / 2, opts.bevelSize);
            const bevelSegments = !(bevelSize > 0) ? 0 : opts.bevelSegments;

            indexCount += indices.length * (opts.excludeBottom ? 1 : 2);
            vertexCount += polygonVertexCount * (opts.excludeBottom ? 1 : 2);
            const ringCount = 2 + bevelSegments * 2;

            let start = 0;
            let end = 0;
            for (let h = 0; h < (holes ? holes.length : 0) + 1; h++) {
                if (h === 0) {
                    end = holes && holes.length ? holes[0] : polygonVertexCount;
                }
                else {
                    start = holes[h - 1];
                    end = holes[h] || polygonVertexCount;
                }

                indexCount += (end - start) * 6 * (ringCount - 1);

                const sideRingVertexCount = (end - start) * (opts.smoothSide ? 1 : 2);
                vertexCount += sideRingVertexCount * ringCount
                    // Double the bevel vertex number if not smooth
                    + (!opts.smoothBevel ? bevelSegments * sideRingVertexCount * 2 : 0);
            }
        }

        const data = {
            position: new Float32Array(vertexCount * 3),
            indices: new (vertexCount > 0xffff ? Uint32Array : Uint16Array)(indexCount),
            uv: new Float32Array(vertexCount * 2)
        };

        const cursors = {
            vertex: 0, index: 0
        };

        for (let d = 0; d < preparedData.length; d++) {
            addTopAndBottom(preparedData[d], data, cursors, opts);
        }

        for (let d = 0; d < preparedData.length; d++) {
            const {holes, vertices} = preparedData[d];
            const topVertexCount = vertices.length / 2;

            let start = 0;
            let end = (holes && holes.length) ? holes[0] : topVertexCount;
            // Add exterior
            addExtrudeSide(data, preparedData[d], start, end, cursors, opts);
            // Add holes
            if (holes) {
                for (let h = 0; h < holes.length; h++) {
                    start = holes[h];
                    end = holes[h + 1] || topVertexCount;
                    addExtrudeSide(data, preparedData[d], start, end, cursors, opts);
                }
            }
        }

        // Wrap uv
        for (let i = 0; i < data.uv.length; i++) {
            const val = data.uv[i];
            if (val > 0 && Math.round(val) === val) {
                data.uv[i] = 1;
            }
            else {
                data.uv[i] = val % 1;
            }
        }

        data.normal = generateNormal(data.indices, data.position);
        // PENDING
        data.boundingRect = preparedData[0] && preparedData[0].rect;

        return data;
    }

    function convertPolylineToTriangulatedPolygon(polyline, polylineIdx, opts) {
        const lineWidth = opts.lineWidth;
        const pointCount = polyline.length;
        const points = new Float32Array(pointCount * 2);
        const translate = opts.translate || [0, 0];
        const scale = opts.scale || [1, 1];
        for (let i = 0, k = 0; i < pointCount; i++) {
            points[k++] = polyline[i][0] * scale[0] + translate[0];
            points[k++] = polyline[i][1] * scale[1] + translate[1];
        }

        if (area$1(points, 0, pointCount) < 0) {
            reversePoints(points, 2, 0, pointCount);
        }

        const insidePoints = [];
        const outsidePoints = [];
        const miterLimit = opts.miterLimit;
        const outsideIndicesMap = innerOffsetPolygon(
            points, outsidePoints, 0, pointCount, 0, -lineWidth / 2, miterLimit, false
        );
        reversePoints(points, 2, 0, pointCount);
        const insideIndicesMap = innerOffsetPolygon(
            points, insidePoints, 0, pointCount, 0, -lineWidth / 2, miterLimit, false
        );

        const polygonVertexCount = (insidePoints.length + outsidePoints.length) / 2;
        const polygonVertices = new Float32Array(polygonVertexCount * 2);

        let offset = 0;
        const outsidePointCount = outsidePoints.length / 2;
        for (let i = 0; i < outsidePoints.length; i++) {
            polygonVertices[offset++] = outsidePoints[i];
        }
        for (let i = 0; i < insidePoints.length; i++) {
            polygonVertices[offset++] = insidePoints[i];
        }

        // Built indices
        const indices = new (polygonVertexCount > 0xffff ? Uint32Array : Uint16Array)(
            ((pointCount - 1) * 2 + (polygonVertexCount - pointCount * 2)) * 3
        );
        let off = 0;
        for (let i = 0; i < pointCount - 1; i++) {
            const i2 = i + 1;
            indices[off++] = outsidePointCount - 1 - outsideIndicesMap[i];
            indices[off++] = outsidePointCount - 1 - outsideIndicesMap[i] - 1;
            indices[off++] = insideIndicesMap[i] + 1 + outsidePointCount;

            indices[off++] = outsidePointCount - 1 - outsideIndicesMap[i];
            indices[off++] = insideIndicesMap[i] + 1 + outsidePointCount;
            indices[off++] = insideIndicesMap[i] + outsidePointCount;

            if (insideIndicesMap[i2] - insideIndicesMap[i] === 2) {
                indices[off++] = insideIndicesMap[i] + 2 + outsidePointCount;
                indices[off++] = insideIndicesMap[i] + 1 + outsidePointCount;
                indices[off++] = outsidePointCount - outsideIndicesMap[i2] - 1;
            }
            else if (outsideIndicesMap[i2] - outsideIndicesMap[i] === 2) {
                indices[off++] = insideIndicesMap[i2] + outsidePointCount;
                indices[off++] = outsidePointCount - 1 - (outsideIndicesMap[i] + 1);
                indices[off++] = outsidePointCount - 1 - (outsideIndicesMap[i] + 2);
            }
        }

        const topVertices = opts.bevelSize > 0
            ? offsetPolygon(polygonVertices, [], opts.bevelSize, null, true) : polygonVertices;
        const boundingRect = opts.boundingRect;
        return {
            vertices: polygonVertices,
            indices,
            topVertices,
            rect: {
                x: boundingRect.x * scale[0] + translate[0],
                y: boundingRect.y * scale[1] + translate[1],
                width: boundingRect.width * scale[0],
                height: boundingRect.height * scale[1],
            },
            depth: typeof opts.depth === 'function' ? opts.depth(polylineIdx) : opts.depth,
            holes: []
        };
    }

    function removeClosePointsOfPolygon(polygon, epsilon) {
        const newPolygon = [];
        for (let k  = 0; k < polygon.length; k++) {
            const points = polygon[k];
            const newPoints = [];
            const len = points.length;
            let x1 = points[len - 1][0];
            let y1 = points[len - 1][1];
            let dist = 0;
            for (let i = 0; i < len; i++) {
                let x2 = points[i][0];
                let y2 = points[i][1];
                const dx = x2 - x1;
                const dy = y2 - y1;
                dist += Math.sqrt(dx * dx + dy * dy);
                if (dist > epsilon) {
                    newPoints.push(points[i]);
                    dist = 0;
                }
                x1 = x2;
                y1 = y2;
            }
            if (newPoints.length >= 3) {
                newPolygon.push(newPoints);
            }
        }
        return newPolygon.length > 0 ? newPolygon : null;
    }

    function simplifyPolygon(polygon, tolerance) {
        const newPolygon = [];
        for (let k  = 0; k < polygon.length; k++) {
            let points = polygon[k];
            points = simplify(points, tolerance, true);
            if (points.length >= 3) {
                newPolygon.push(points);
            }
        }
        return newPolygon.length > 0 ? newPolygon : null;
    }
    /**
     *
     * @param {Array} polygons Polygons array that match GeoJSON MultiPolygon geometry.
     * @param {Object} [opts]
     * @param {number|Function} [opts.depth]
     * @param {number} [opts.bevelSize = 0]
     * @param {number} [opts.bevelSegments = 2]
     * @param {number} [opts.simplify = 0]
     * @param {boolean} [opts.smoothSide = false]
     * @param {boolean} [opts.smoothBevel = false]
     * @param {boolean} [opts.excludeBottom = false]
     * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
     * @param {Array} [opts.translate]
     * @param {Array} [opts.scale]
     *
     * @return {Object} {indices, position, uv, normal, boundingRect}
     */
    function extrudePolygon(polygons, opts) {

        opts = Object.assign({}, opts);

        const min = [Infinity, Infinity];
        const max = [-Infinity, -Infinity];
        for (let i = 0; i < polygons.length; i++) {
            updateBoundingRect(polygons[i][0], min, max);
        }
        opts.boundingRect = opts.boundingRect || {
            x: min[0], y: min[1], width: max[0] - min[0], height: max[1] - min[1]
        };

        normalizeOpts(opts);

        const preparedData = [];
        const translate = opts.translate || [0, 0];
        const scale = opts.scale || [1, 1];
        const boundingRect = opts.boundingRect;
        const transformdRect = {
            x: boundingRect.x * scale[0] + translate[0],
            y: boundingRect.y * scale[1] + translate[1],
            width: boundingRect.width * scale[0],
            height: boundingRect.height * scale[1],
        };

        const epsilon = Math.min(
            boundingRect.width, boundingRect.height
        ) / 1e5;
        for (let i = 0; i < polygons.length; i++) {
            let newPolygon = removeClosePointsOfPolygon(polygons[i], epsilon);
            if (!newPolygon) {
                continue;
            }
            const simplifyTolerance = opts.simplify / Math.max(scale[0], scale[1]);
            if (simplifyTolerance > 0) {
                newPolygon = simplifyPolygon(newPolygon, simplifyTolerance);
            }
            if (!newPolygon) {
                continue;
            }

            const {vertices, holes, dimensions} = earcut_1.flatten(newPolygon);

            for (let k = 0; k < vertices.length;) {
                vertices[k] = vertices[k++] * scale[0] + translate[0];
                vertices[k] = vertices[k++] * scale[1] + translate[1];
            }

            convertToClockwise(vertices, holes);

            if (dimensions !== 2) {
                throw new Error('Only 2D polygon points are supported');
            }
            const topVertices = opts.bevelSize > 0
                ? offsetPolygon(vertices, holes, opts.bevelSize, null, true) : vertices;
            const indices = triangulate(topVertices, holes, dimensions);
            preparedData.push({
                indices,
                vertices,
                topVertices,
                holes,
                rect: transformdRect,
                depth: typeof opts.depth === 'function' ? opts.depth(i) : opts.depth
            });
        }
        return innerExtrudeTriangulatedPolygon(preparedData, opts);
    }
    /**
     *
     * @param {Array} polylines Polylines array that match GeoJSON MultiLineString geometry.
     * @param {Object} [opts]
     * @param {number} [opts.depth]
     * @param {number} [opts.bevelSize = 0]
     * @param {number} [opts.bevelSegments = 2]
     * @param {number} [opts.simplify = 0]
     * @param {boolean} [opts.smoothSide = false]
     * @param {boolean} [opts.smoothBevel = false]
     * @param {boolean} [opts.excludeBottom = false]
     * @param {boolean} [opts.lineWidth = 1]
     * @param {boolean} [opts.miterLimit = 2]
     * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
     * @param {Array} [opts.translate]
     * @param {Array} [opts.scale]
     * @param {Object} [opts.boundingRect]
     * @return {Object} {indices, position, uv, normal, boundingRect}
     */
    function extrudePolyline(polylines, opts) {

        opts = Object.assign({}, opts);

        const min = [Infinity, Infinity];
        const max = [-Infinity, -Infinity];
        for (let i = 0; i < polylines.length; i++) {
            updateBoundingRect(polylines[i], min, max);
        }
        opts.boundingRect = opts.boundingRect || {
            x: min[0], y: min[1], width: max[0] - min[0], height: max[1] - min[1]
        };

        normalizeOpts(opts);
        const scale = opts.scale || [1, 1];

        if (opts.lineWidth == null) {
            opts.lineWidth = 1;
        }
        if (opts.miterLimit == null) {
            opts.miterLimit = 2;
        }
        const preparedData = [];
        // Extrude polyline to polygon
        for (let i = 0; i < polylines.length; i++) {
            let newPolyline = polylines[i];
            const simplifyTolerance = opts.simplify / Math.max(scale[0], scale[1]);
            if (simplifyTolerance > 0) {
                newPolyline = simplify(newPolyline, simplifyTolerance, true);
            }
            preparedData.push(convertPolylineToTriangulatedPolygon(newPolyline, i, opts));
        }

        return innerExtrudeTriangulatedPolygon(preparedData, opts);
    }

    function updateBoundingRect(points, min, max) {
        for (let i = 0; i < points.length; i++) {
            min[0] = Math.min(points[i][0], min[0]);
            min[1] = Math.min(points[i][1], min[1]);
            max[0] = Math.max(points[i][0], max[0]);
            max[1] = Math.max(points[i][1], max[1]);
        }
    }

    /**
     *
     * @param {Object} geojson
     * @param {Object} [opts]
     * @param {number} [opts.depth]
     * @param {number} [opts.bevelSize = 0]
     * @param {number} [opts.bevelSegments = 2]
     * @param {number} [opts.simplify = 0]
     * @param {boolean} [opts.smoothSide = false]
     * @param {boolean} [opts.smoothBevel = false]
     * @param {boolean} [opts.excludeBottom = false]
     * @param {boolean} [opts.lineWidth = 1]
     * @param {boolean} [opts.miterLimit = 2]
     * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
     * @param {Array} [opts.translate]
     * @param {Array} [opts.scale]
     * @param {Object} [opts.boundingRect]
     * @return {Object} {polyline: {indices, position, uv, normal}, polygon: {indices, position, uv, normal}}
     */

     // TODO Not merge feature
    function extrudeGeoJSON(geojson, opts) {

        opts = Object.assign({}, opts);

        const polylines = [];
        const polygons = [];

        const polylineFeatureIndices = [];
        const polygonFeatureIndices = [];

        const min = [Infinity, Infinity];
        const max = [-Infinity, -Infinity];

        for (let i = 0; i < geojson.features.length; i++) {
            const feature = geojson.features[i];
            const geometry = feature.geometry;
            if (geometry && geometry.coordinates) {
                switch (geometry.type) {
                    case 'LineString':
                        polylines.push(geometry.coordinates);
                        polylineFeatureIndices.push(i);
                        updateBoundingRect(geometry.coordinates, min, max);
                        break;
                    case 'MultiLineString':
                        for (let k = 0; k < geometry.coordinates.length; k++) {
                            polylines.push(geometry.coordinates[k]);
                            polylineFeatureIndices.push(i);
                            updateBoundingRect(geometry.coordinates[k], min, max);
                        }
                        break;
                    case 'Polygon':
                        polygons.push(geometry.coordinates);
                        polygonFeatureIndices.push(i);
                        updateBoundingRect(geometry.coordinates[0], min, max);
                        break;
                    case 'MultiPolygon':
                        for (let k = 0; k < geometry.coordinates.length; k++) {
                            polygons.push(geometry.coordinates[k]);
                            polygonFeatureIndices.push(i);
                            updateBoundingRect(geometry.coordinates[k][0], min, max);
                        }
                        break;
                }
            }
        }

        opts.boundingRect = opts.boundingRect || {
            x: min[0], y: min[1], width: max[0] - min[0], height: max[1] - min[1]
        };

        const originalDepth = opts.depth;
        return {
            polyline: extrudePolyline(polylines, Object.assign(opts, {
                depth: function (idx) {
                    if (typeof originalDepth === 'function') {
                        return originalDepth(
                            geojson.features[polylineFeatureIndices[idx]]
                        );
                    }
                    return originalDepth;
                }
            })),
            polygon: extrudePolygon(polygons, Object.assign(opts, {
                depth: function (idx) {
                    if (typeof originalDepth === 'function') {
                        return originalDepth(
                            geojson.features[polygonFeatureIndices[idx]]
                        );
                    }
                    return originalDepth;
                }
            }))
        };
    }

    var main = /*#__PURE__*/Object.freeze({
        __proto__: null,
        triangulate: triangulate,
        flatten: flatten,
        offsetPolygon: offsetPolygon,
        extrudePolygon: extrudePolygon,
        extrudePolyline: extrudePolyline,
        extrudeGeoJSON: extrudeGeoJSON
    });

    /* eslint-disable indent */
    const TYPES = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
    function getGeoJSONType(feature) {
        return feature.geometry ? feature.geometry.type : null;
    }
    function isGeoJSON(feature) {
        const type = getGeoJSONType(feature);
        if (type) {
            for (let i = 0, len = TYPES.length; i < len; i++) {
                if (TYPES[i] === type) {
                    return true;
                }
            }
        }
        return false;
    }
    function isGeoJSONPolygon(feature) {
        const type = getGeoJSONType(feature);
        if (type && (type === TYPES[4] || type === TYPES[5])) {
            return true;
        }
        return false;
    }
    function isGeoJSONLine(feature) {
        const type = getGeoJSONType(feature);
        if (type && (type === TYPES[2] || type === TYPES[3])) {
            return true;
        }
        return false;
    }
    function isGeoJSONPoint(feature) {
        const type = getGeoJSONType(feature);
        if (type && (type === TYPES[0] || type === TYPES[1])) {
            return true;
        }
        return false;
    }
    function isGeoJSONMulti(feature) {
        const type = getGeoJSONType(feature);
        if (type) {
            if (type.indexOf('Multi') > -1) {
                return true;
            }
        }
        return false;
    }
    function getGeoJSONCoordinates(feature) {
        return feature.geometry ? feature.geometry.coordinates : [];
    }
    function getGeoJSONCenter(feature) {
        const type = getGeoJSONType(feature);
        if (!type || !feature.geometry) {
            return null;
        }
        const geometry = feature.geometry;
        const coordinates = geometry.coordinates;
        if (!coordinates) {
            return null;
        }
        const coords = [];
        switch (type) {
            case 'Point': {
                coords.push(coordinates);
                break;
            }
            case 'MultiPoint':
            case 'LineString': {
                for (let i = 0, len = coordinates.length; i < len; i++) {
                    coords.push(coordinates[i]);
                }
                break;
            }
            case 'MultiLineString':
            case 'Polygon': {
                for (let i = 0, len = coordinates.length; i < len; i++) {
                    for (let j = 0, len1 = coordinates[i].length; j < len1; j++) {
                        coords.push(coordinates[i][j]);
                    }
                }
                break;
            }
            case 'MultiPolygon': {
                for (let i = 0, len = coordinates.length; i < len; i++) {
                    for (let j = 0, len1 = coordinates[i].length; j < len1; j++) {
                        for (let m = 0, len2 = coordinates[i][j].length; m < len2; m++) {
                            coords.push((coordinates[i][j])[m]);
                        }
                    }
                }
                break;
            }
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0, len = coords.length; i < len; i++) {
            const c = coords[i];
            const x = c[0], y = c[1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        return new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
    }
    function spliteGeoJSONMulti(feature) {
        const type = getGeoJSONType(feature);
        if (!type || !feature.geometry) {
            return null;
        }
        const geometry = feature.geometry;
        const properties = feature.properties || {};
        const coordinates = geometry.coordinates;
        if (!coordinates) {
            return null;
        }
        const features = [];
        let fType;
        switch (type) {
            case 'MultiPoint': {
                fType = 'Point';
                break;
            }
            case 'MultiLineString': {
                fType = 'LineString';
                break;
            }
            case 'MultiPolygon': {
                fType = 'Polygon';
                break;
            }
        }
        if (fType) {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: fType,
                        coordinates: coordinates[i]
                    },
                    properties
                });
            }
        }
        else {
            features.push(feature);
        }
        return features;
    }

    var GeoJSONUtil = /*#__PURE__*/Object.freeze({
        __proto__: null,
        isGeoJSON: isGeoJSON,
        isGeoJSONPolygon: isGeoJSONPolygon,
        isGeoJSONLine: isGeoJSONLine,
        isGeoJSONPoint: isGeoJSONPoint,
        isGeoJSONMulti: isGeoJSONMulti,
        getGeoJSONCoordinates: getGeoJSONCoordinates,
        getGeoJSONCenter: getGeoJSONCenter,
        spliteGeoJSONMulti: spliteGeoJSONMulti
    });

    const COMMA = ',';
    /**
     *
     * @param {maptalks.LineString} lineString
     * @param {ThreeLayer} layer
     */
    function getLinePosition(lineString, layer, center) {
        const positions = [];
        const positionsV = [];
        if (Array.isArray(lineString) && lineString[0] instanceof THREE.Vector3) {
            for (let i = 0, len = lineString.length; i < len; i++) {
                const v = lineString[i];
                positions.push(v.x, v.y, v.z);
                positionsV.push(v);
            }
        }
        else {
            if (Array.isArray(lineString)) {
                lineString = new maptalks.LineString(lineString);
            }
            const z = 0;
            //support geojson
            let coordinates, cent;
            if (isGeoJSON(lineString)) {
                coordinates = getGeoJSONCoordinates(lineString);
                cent = getGeoJSONCenter(lineString);
            }
            else if (lineString instanceof maptalks.LineString) {
                coordinates = lineString.getCoordinates();
                cent = lineString.getCenter();
            }
            const centerPt = layer.coordinateToVector3(center || cent);
            for (let i = 0, len = coordinates.length; i < len; i++) {
                let coordinate = coordinates[i];
                if (Array.isArray(coordinate)) {
                    coordinate = new maptalks.Coordinate(coordinate);
                }
                const v = layer.coordinateToVector3(coordinate, z).sub(centerPt);
                positions.push(v.x, v.y, v.z);
                positionsV.push(v);
            }
        }
        return {
            positions: positions,
            positionsV: positionsV
        };
    }
    /**
     *
     * @param {maptalks.LineString} lineString
     * @param {Number} lineWidth
     * @param {Number} depth
     * @param {ThreeLayer} layer
     */
    function getExtrudeLineGeometry(lineString, lineWidth = 1, depth = 1, layer, center) {
        const positions = getLinePosition(lineString, layer, center).positionsV;
        const ps = [];
        for (let i = 0, len = positions.length; i < len; i++) {
            const p = positions[i];
            ps.push([p.x, p.y]);
        }
        const { indices, position, normal, uv } = extrudePolyline([ps], {
            lineWidth,
            depth
        });
        const geometry = new THREE.BufferGeometry();
        addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(position, 3));
        addAttribute(geometry, 'normal', new THREE.Float32BufferAttribute(normal, 3));
        addAttribute(geometry, 'uv', new THREE.Float32BufferAttribute(uv, 2));
        geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
        return geometry;
    }
    /**
     *
     * @param {Array[Array]} chunkLines
     * @param {*} layer
     */
    function getChunkLinesPosition(chunkLines, layer, positionMap, centerPt) {
        const positions = [], positionsV = [], lnglats = [];
        for (let i = 0, len = chunkLines.length; i < len; i++) {
            const line = chunkLines[i];
            for (let j = 0, len1 = line.length; j < len1; j++) {
                const lnglat = line[j];
                if (lnglats.length > 0) {
                    const key = lnglat.join(COMMA).toString();
                    const key1 = lnglats[lnglats.length - 1].join(COMMA).toString();
                    if (key !== key1) {
                        lnglats.push(lnglat);
                    }
                }
                else {
                    lnglats.push(lnglat);
                }
            }
        }
        const z = 0;
        for (let i = 0, len = lnglats.length; i < len; i++) {
            const lnglat = lnglats[i];
            let v;
            const key = lnglat.join(COMMA).toString();
            if (positionMap && positionMap[key]) {
                v = positionMap[key];
            }
            else {
                v = layer.coordinateToVector3(lnglat, z).sub(centerPt);
            }
            positionsV.push(v);
            positions.push(v.x, v.y, v.z);
        }
        return {
            positions: positions,
            positionsV: positionsV,
            lnglats: lnglats
        };
    }
    /**
     *
     * @param {*} lineString
     * @param {*} lineWidth
     * @param {*} depth
     * @param {*} layer
     */
    function getExtrudeLineParams(lineString, lineWidth = 1, depth = 1, layer, center) {
        const positions = getLinePosition(lineString, layer, center).positionsV;
        const ps = [];
        for (let i = 0, len = positions.length; i < len; i++) {
            const p = positions[i];
            ps.push([p.x, p.y]);
        }
        const { indices, position, normal, uv } = extrudePolyline([ps], {
            lineWidth: lineWidth,
            depth: depth
        });
        return {
            position: position,
            normal: normal,
            indices: indices,
            uv
        };
    }
    function LineStringSplit(lineString) {
        let lineStrings = [], center;
        if (lineString instanceof maptalks.MultiLineString) {
            lineStrings = lineString.getGeometries();
            center = lineString.getCenter();
        }
        else if (lineString instanceof maptalks.LineString) {
            lineStrings.push(lineString);
            center = lineString.getCenter();
        }
        else if (isGeoJSON(lineString)) {
            center = getGeoJSONCenter(lineString);
            if (isGeoJSONMulti(lineString)) {
                lineStrings = spliteGeoJSONMulti(lineString);
            }
            else {
                lineStrings.push(lineString);
            }
        }
        return {
            lineStrings,
            center
        };
    }

    var LineUtil = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getLinePosition: getLinePosition,
        getExtrudeLineGeometry: getExtrudeLineGeometry,
        getChunkLinesPosition: getChunkLinesPosition,
        getExtrudeLineParams: getExtrudeLineParams,
        LineStringSplit: LineStringSplit
    });

    function initColors(cs) {
        const colors = [];
        if (cs && cs.length) {
            cs.forEach(color => {
                color = (color instanceof THREE.Color ? color : new THREE.Color(color));
                colors.push(color.r, color.g, color.b);
            });
        }
        return colors;
    }
    const OPTIONS$2 = {
        altitude: 0,
        bottomHeight: 0,
        colors: null
    };
    /**
     *
     */
    class Line extends BaseObject {
        constructor(lineString, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$2, options, { layer, lineString });
            super();
            this._initOptions(options);
            const { lineStrings, center } = LineStringSplit(lineString);
            const ps = [];
            for (let i = 0, len = lineStrings.length; i < len; i++) {
                const lineString = lineStrings[i];
                const { positionsV } = getLinePosition(lineString, layer, center);
                for (let j = 0, len1 = positionsV.length; j < len1; j++) {
                    const v = positionsV[j];
                    if (j > 0 && j < len1 - 1) {
                        ps.push(v.x, v.y, v.z);
                    }
                    ps.push(v.x, v.y, v.z);
                }
            }
            const geometry = new THREE.BufferGeometry();
            addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(ps, 3));
            setBottomHeight(geometry, options.bottomHeight, layer);
            const colors = initColors(options.colors);
            if (colors && colors.length) {
                addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3));
                material.vertexColors = getVertexColors();
            }
            this._createLineSegments(geometry, material);
            const { altitude } = options;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this.type = 'Line';
        }
    }

    const topColor$1 = new THREE.Color('#fff'), bottomColor$1 = new THREE.Color('#fff');
    /**
     * this is for ExtrudeMesh util
     */
    /**
     * Fix the bug in the center of multipoygon
     * @param {maptalks.Polygon} polygon
     * @param {*} layer
     */
    // export function toShape(datas = []) {
    //     const shapes = [];
    //     for (let i = 0, len = datas.length; i < len; i++) {
    //         const { outer, holes } = datas[i];
    //         const shape = [outer];
    //         if (holes && holes.length) {
    //             for (let j = 0, len1 = holes.length; j < len1; j++) {
    //                 shape.push(holes[j]);
    //             }
    //         }
    //         shapes.push(shape);
    //     }
    //     return shapes;
    // }
    /**
     *  Support custom center point
     * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
     * @param {*} height
     * @param {*} layer
     */
    function getExtrudeGeometry(polygon, height, layer, center) {
        const { position, normal, uv, indices } = getExtrudeGeometryParams(polygon, height, layer, center);
        const color = new Float32Array(position.length);
        color.fill(1, 0, position.length);
        const bufferGeomertry = new THREE.BufferGeometry();
        addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
        addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(normal, 3));
        addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(position, 3));
        addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(uv, 2));
        bufferGeomertry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
        return bufferGeomertry;
    }
    function getExtrudeGeometryParams(polygon, height, layer, center, altCache) {
        const datas = getPolygonPositions(polygon, layer, center);
        const shapes = datas;
        //Possible later use of geojson
        if (!shapes)
            return null;
        //Reduce height and repeat calculation
        if (altCache) {
            if (altCache[height] == null) {
                altCache[height] = layer.distanceToVector3(height, height).x;
            }
            height = altCache[height];
        }
        else {
            height = layer.distanceToVector3(height, height).x;
        }
        const { position, normal, uv, indices } = extrudePolygon(shapes, {
            depth: height
        });
        return {
            position, normal, uv, indices
        };
    }
    /**
     *
     * @param {*} geometry
     * @param {*} color
     * @param {*} _topColor
     */
    function initVertexColors$1(geometry, color, _topColor, minZ) {
        if (minZ === undefined) {
            minZ = 0;
        }
        const position = geometry.attributes.position.array;
        const len = position.length;
        bottomColor$1.setStyle(color);
        topColor$1.setStyle(_topColor);
        const colors = [];
        if (Array.isArray(minZ)) {
            for (let i = 0, len = minZ.length; i < len; i++) {
                const { middleZ, start, end } = minZ[i].position;
                for (let j = start; j < end; j += 3) {
                    const z = position[j + 2];
                    if (z > middleZ) {
                        colors[j] = topColor$1.r;
                        colors[j + 1] = topColor$1.g;
                        colors[j + 2] = topColor$1.b;
                    }
                    else {
                        colors[j] = bottomColor$1.r;
                        colors[j + 1] = bottomColor$1.g;
                        colors[j + 2] = bottomColor$1.b;
                    }
                }
            }
        }
        else {
            for (let i = 0; i < len; i += 3) {
                const z = position[i + 2];
                if (z > minZ) {
                    colors.push(topColor$1.r, topColor$1.g, topColor$1.b);
                }
                else {
                    colors.push(bottomColor$1.r, bottomColor$1.g, bottomColor$1.b);
                }
            }
        }
        addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
        return colors;
    }
    /**
     *
     * @param {*} polygon
     * @param {*} layer
     * @param {*} center
     */
    function getPolygonPositions(polygon, layer, center, isArrayBuff = false) {
        if (!polygon) {
            return null;
        }
        let datas = [];
        if (polygon instanceof maptalks.MultiPolygon) {
            datas = polygon.getGeometries().map(p => {
                return getSinglePolygonPositions(p, layer, center || polygon.getCenter(), isArrayBuff);
            });
        }
        else if (polygon instanceof maptalks.Polygon) {
            const data = getSinglePolygonPositions(polygon, layer, center || polygon.getCenter(), isArrayBuff);
            datas.push(data);
        }
        else if (isGeoJSONPolygon(polygon)) {
            const cent = getGeoJSONCenter(polygon);
            if (!isGeoJSONMulti(polygon)) {
                const data = getSinglePolygonPositions(polygon, layer, center || cent, isArrayBuff);
                datas.push(data);
            }
            else {
                const fs = spliteGeoJSONMulti(polygon);
                for (let i = 0, len = fs.length; i < len; i++) {
                    datas.push(getSinglePolygonPositions(fs[i], layer, center || cent, isArrayBuff));
                }
            }
        }
        return datas;
    }
    function getSinglePolygonPositions(polygon, layer, center, isArrayBuff = false) {
        let shell, holes;
        //it is pre for geojson,Possible later use of geojson
        if (isGeoJSONPolygon(polygon)) {
            const coordinates = getGeoJSONCoordinates(polygon);
            shell = coordinates[0];
            holes = coordinates.slice(1, coordinates.length);
            center = center || getGeoJSONCenter(polygon);
        }
        else if (polygon instanceof maptalks.Polygon) {
            shell = polygon.getShell();
            holes = polygon.getHoles();
            center = center || polygon.getCenter();
        }
        const centerPt = layer.coordinateToVector3(center);
        let outer;
        if (isArrayBuff) {
            outer = new Float32Array(shell.length * 2);
        }
        else {
            outer = [];
        }
        for (let i = 0, len = shell.length; i < len; i++) {
            const c = shell[i];
            const v = layer.coordinateToVector3(c).sub(centerPt);
            if (isArrayBuff) {
                const idx = i * 2;
                outer[idx] = v.x;
                outer[idx + 1] = v.y;
                // outer[idx + 2] = v.z;
            }
            else {
                outer.push([v.x, v.y]);
            }
        }
        const data = [(isArrayBuff ? outer.buffer : outer)];
        if (holes && holes.length > 0) {
            for (let i = 0, len = holes.length; i < len; i++) {
                const pts = (isArrayBuff ? new Float32Array(holes[i].length * 2) : []);
                for (let j = 0, len1 = holes[i].length; j < len1; j++) {
                    const c = holes[i][j];
                    const pt = layer.coordinateToVector3(c).sub(centerPt);
                    if (isArrayBuff) {
                        const idx = j * 2;
                        pts[idx] = pt.x;
                        pts[idx + 1] = pt.y;
                        // pts[idx + 2] = pt.z;
                    }
                    else {
                        pts.push([pt.x, pt.y]);
                    }
                }
                data.push((isArrayBuff ? pts.buffer : pts));
            }
        }
        return data;
    }

    var ExtrudeUtil = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getExtrudeGeometry: getExtrudeGeometry,
        getExtrudeGeometryParams: getExtrudeGeometryParams,
        initVertexColors: initVertexColors$1,
        getPolygonPositions: getPolygonPositions,
        getSinglePolygonPositions: getSinglePolygonPositions
    });

    const OPTIONS$3 = {
        bottomHeight: 0,
        width: 3,
        height: 1,
        altitude: 0,
        topColor: null,
        bottomColor: '#2d2f61',
    };
    /**
     *
     */
    class ExtrudeLine extends BaseObject {
        constructor(lineString, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$3, options, { layer, lineString });
            super();
            this._initOptions(options);
            const { height, width, bottomColor, topColor, bottomHeight, altitude } = options;
            const h = layer.distanceToVector3(height, height).x;
            const w = layer.distanceToVector3(width, width).x;
            const { lineStrings, center } = LineStringSplit(lineString);
            const extrudeParams = [];
            let minZ = 0;
            const cache = {};
            for (let i = 0, len = lineStrings.length; i < len; i++) {
                const attribute = getExtrudeLineParams(lineStrings[i], w, h, layer, center);
                minZ = setBottomHeight(attribute, bottomHeight, layer, cache);
                extrudeParams.push(attribute);
            }
            const geometry = mergeBufferGeometries(extrudeParams);
            if (topColor) {
                initVertexColors$1(geometry, bottomColor, topColor, minZ + h / 2);
                material.vertexColors = getVertexColors();
            }
            this._createMesh(geometry, material);
            // const center = (isGeoJSON(lineString) ? getGeoJSONCenter(lineString) : lineString.getCenter());
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this.type = 'ExtrudeLine';
        }
    }

    const OPTIONS$4 = {
        altitude: 0,
        height: 1,
        bottomHeight: 0,
        topColor: null,
        bottomColor: '#2d2f61',
    };
    /**
     *
     */
    class ExtrudePolygon extends BaseObject {
        constructor(polygon, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$4, options, { layer, polygon });
            super();
            this._initOptions(options);
            const { height, topColor, bottomColor, altitude, bottomHeight } = options;
            const geometry = getExtrudeGeometry(polygon, height, layer);
            const center = (isGeoJSONPolygon(polygon) ? getGeoJSONCenter(polygon) : polygon.getCenter());
            const h = setBottomHeight(geometry, bottomHeight, layer);
            if (topColor) {
                const extrudeH = layer.distanceToVector3(height, height).x;
                initVertexColors$1(geometry, bottomColor, topColor, h + extrudeH / 2);
                material.vertexColors = getVertexColors();
            }
            this._createMesh(geometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this.type = 'ExtrudePolygon';
        }
    }

    const OPTIONS$5 = {
        altitude: 0,
        coordinate: null
    };
    /**
     * Model container
     */
    class Model extends BaseObject {
        constructor(model, options = {}, layer) {
            if (!options.coordinate) {
                console.warn('coordinate is null,it is important to locate the model');
                options.coordinate = layer.getMap().getCenter();
            }
            options = maptalks.Util.extend({}, OPTIONS$5, options, { layer, model });
            super();
            this._initOptions(options);
            this._createGroup();
            this.getObject3d().add(model);
            const { altitude, coordinate } = options;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const position = layer.coordinateToVector3(coordinate, z);
            this.getObject3d().position.copy(position);
            this.type = 'Model';
        }
    }

    const PI = Math.PI / 180;
    const R = 6378137;
    const MINLENGTH = 1;
    function formatLineArray(polyline) {
        const lnglats = polyline.getCoordinates();
        return lnglats.map(lnglat => {
            return lnglat.toArray();
        });
    }
    function degreesToRadians(d) {
        return d * PI;
    }
    function distance(c1, c2) {
        if (!c1 || !c2) {
            return 0;
        }
        if (!Array.isArray(c1)) {
            c1 = c1.toArray();
        }
        if (!Array.isArray(c2)) {
            c2 = c2.toArray();
        }
        let b = degreesToRadians(c1[1]);
        const d = degreesToRadians(c2[1]), e = b - d, f = degreesToRadians(c1[0]) - degreesToRadians(c2[0]);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
        b *= R;
        return Math.round(b * 1E5) / 1E5;
    }
    function lineLength(polyline) {
        let lnglatArray = polyline;
        if (!Array.isArray(polyline)) {
            lnglatArray = formatLineArray(polyline);
        }
        let l = 0;
        for (let i = 0, len = lnglatArray.length; i < len - 1; i++) {
            l += distance(lnglatArray[i], lnglatArray[i + 1]);
        }
        return l;
    }
    function getPercentLngLat(l, length) {
        const { len, c1, c2 } = l;
        const dx = c2[0] - c1[0], dy = c2[1] - c1[1];
        const percent = length / len;
        const lng = c1[0] + percent * dx;
        const lat = c1[1] + percent * dy;
        return [lng, lat];
    }
    /**
     * This is not an accurate line segment cutting method, but rough, in order to speed up the calculation,
     * the correct cutting algorithm can be referred to. http://turfjs.org/docs/#lineChunk
     * @param {*} cs
     * @param {*} lineChunkLength
     */
    function lineSlice(cs, lineChunkLength = 10) {
        lineChunkLength = Math.max(lineChunkLength, MINLENGTH);
        if (!Array.isArray(cs)) {
            cs = formatLineArray(cs);
        }
        const LEN = cs.length;
        let list = [];
        let totalLen = 0;
        for (let i = 0; i < LEN - 1; i++) {
            const len = distance(cs[i], cs[i + 1]);
            const floorlen = Math.floor(len);
            list.push({
                c1: cs[i],
                len: floorlen,
                c2: cs[i + 1]
            });
            totalLen += floorlen;
        }
        if (totalLen <= lineChunkLength) {
            const lnglats = list.map(d => {
                return [d.c1, d.c2];
            });
            return lnglats;
        }
        if (list.length === 1) {
            if (list[0].len <= lineChunkLength) {
                return [
                    [list[0].c1, list[0].c2]
                ];
            }
        }
        const LNGLATSLEN = list.length;
        const first = list[0];
        let idx = 0;
        let currentLngLat;
        let currentLen = 0;
        const lines = [];
        let lls = [first.c1];
        while (idx < LNGLATSLEN) {
            const { len, c2 } = list[idx];
            currentLen += len;
            if (currentLen < lineChunkLength) {
                lls.push(c2);
                if (idx === LNGLATSLEN - 1) {
                    lines.push(lls);
                }
                idx++;
            }
            if (currentLen === lineChunkLength) {
                lls.push(c2);
                currentLen = 0;
                lines.push(lls);
                //next
                lls = [c2];
                idx++;
            }
            if (currentLen > lineChunkLength) {
                const offsetLen = (len - currentLen + lineChunkLength);
                currentLngLat = getPercentLngLat(list[idx], offsetLen);
                lls.push(currentLngLat);
                lines.push(lls);
                currentLen = 0;
                list[idx].c1 = currentLngLat;
                list[idx].len = len - offsetLen;
                //next
                lls = [];
                lls.push(currentLngLat);
            }
        }
        return lines;
    }

    var GeoUtil = /*#__PURE__*/Object.freeze({
        __proto__: null,
        distance: distance,
        lineLength: lineLength,
        lineSlice: lineSlice
    });

    const MAX_POINTS = 1000;
    /**
     *
     * @param {THREE.BufferGeometry} geometry
     * @param {*} ps
     * @param {*} norls
     * @param {*} indices
     */
    function setExtrudeLineGeometryAttribute(geometry, ps, norls, indices) {
        const len = ps.length;
        geometry.attributes.normal.count = len;
        geometry.attributes.position.count = len;
        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;
        for (let i = 0; i < len; i++) {
            positions[i] = ps[i];
            normals[i] = norls[i];
        }
        // geometry.index.array = new Uint16Array(indices.length);
        geometry.index.count = indices.length;
        // geometry.index.needsUpdate = true;
        for (let i = 0, len1 = indices.length; i < len1; i++) {
            geometry.index.array[i] = indices[i];
        }
        // geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
        // geometry.setDrawRange(0, len / 3);
    }
    const OPTIONS$6 = {
        trail: 5,
        chunkLength: 50,
        width: 2,
        height: 1,
        speed: 1,
        altitude: 0,
        interactive: false
    };
    /**
     *
     */
    class ExtrudeLineTrail extends BaseObject {
        constructor(lineString, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$6, options, { layer, lineString });
            super();
            this._initOptions(options);
            const { width, height, altitude, speed, chunkLength, trail } = options;
            let center, coordinates;
            if (isGeoJSON(lineString)) {
                center = getGeoJSONCenter(lineString);
                coordinates = getGeoJSONCoordinates(lineString);
            }
            else {
                center = lineString.getCenter();
                coordinates = lineString;
            }
            const chunkLines = lineSlice(coordinates, chunkLength);
            const centerPt = layer.coordinateToVector3(center);
            //cache position for  faster computing,reduce double counting
            const positionMap = {};
            for (let i = 0, len = chunkLines.length; i < len; i++) {
                const chunkLine = chunkLines[i];
                for (let j = 0, len1 = chunkLine.length; j < len1; j++) {
                    const lnglat = chunkLine[j];
                    const key = lnglat.join(',').toString();
                    if (!positionMap[key]) {
                        positionMap[key] = layer.coordinateToVector3(lnglat).sub(centerPt);
                    }
                }
            }
            const positions = getChunkLinesPosition(chunkLines.slice(0, 1), layer, positionMap, centerPt).positionsV;
            //generate geometry
            const geometry = new THREE.BufferGeometry();
            const ps = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
            const norls = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
            const inds = new Uint16Array(MAX_POINTS);
            addAttribute(geometry, 'position', (new THREE.BufferAttribute(ps, 3)));
            addAttribute(geometry, 'normal', (new THREE.BufferAttribute(norls, 3)));
            geometry.setIndex(new THREE.BufferAttribute(inds, 1));
            const lineWidth = layer.distanceToVector3(width, width).x;
            const depth = layer.distanceToVector3(height, height).x;
            const params = getExtrudeLineParams(positions, lineWidth, depth, layer);
            setExtrudeLineGeometryAttribute(geometry, params.position, params.normal, params.indices);
            this._createMesh(geometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this._params = {
                index: 0,
                chunkLines,
                geometries: [],
                layer,
                trail: Math.max(1, trail),
                lineWidth,
                depth,
                speed: Math.min(1, speed),
                idx: 0,
                loaded: false,
                positionMap,
                centerPt
            };
            this._init(this._params);
            this.type = 'ExtrudeLineTrail';
        }
        /**
         * Follow-up support for adding webworker
         * @param {*} params
         */
        _init(params) {
            const { layer, trail, lineWidth, depth, chunkLines, positionMap, centerPt } = params;
            const len = chunkLines.length, geometries = [];
            for (let i = 0; i < len; i++) {
                const lines = chunkLines.slice(i, i + trail);
                const ps = getChunkLinesPosition(lines, layer, positionMap, centerPt).positionsV;
                geometries.push(getExtrudeLineParams(ps, lineWidth, depth, layer));
            }
            this._params.geometries = geometries;
            this._params.loaded = true;
        }
        _animation() {
            const { index, geometries, speed, idx, chunkLines, trail, lineWidth, depth, loaded, layer, positionMap, centerPt } = this._params;
            if (!loaded)
                return;
            const i = Math.round(index);
            if (i > idx) {
                this._params.idx++;
                let p = geometries[i];
                //if not init, this is will running
                if (!p) {
                    const lines = chunkLines.slice(i, i + trail);
                    const ps = getChunkLinesPosition(lines, layer, positionMap, centerPt).positionsV;
                    p = getExtrudeLineParams(ps, lineWidth, depth, layer);
                    geometries[i] = p;
                }
                const object3d = this.getObject3d();
                setExtrudeLineGeometryAttribute(object3d.geometry, p.position, p.normal, p.indices);
                object3d.geometry.attributes.position.needsUpdate = true;
                object3d.geometry.attributes.normal.needsUpdate = true;
                object3d.geometry.index.needsUpdate = true;
            }
            if (index >= chunkLines.length - 1) {
                this._params.index = -1;
                this._params.idx = -1;
            }
            this._params.index += speed;
        }
    }

    const EVENTS = ['click', 'mousemove', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].join(' ').toString();
    const defaultMaterial = new THREE.MeshBasicMaterial();
    defaultMaterial.vertexColors = getVertexColors();
    /**
     * This is for the merger, MergedExtrudeMesh,Points ...
     * @param {*} Base
     */
    const MergedMixin = (Base) => {
        return class extends Base {
            // this._faceMap=[];
            // this._baseObjects = [];
            // this._datas = [];
            // this.faceIndex = null;
            // this.index=null;
            // this._geometriesAttributes = [];
            // this._geometryCache = geometry.clone();
            // this.isHide = false;
            /**
             *
             * @param {*} baseObjects
             */
            _initBaseObjectsEvent(baseObjects) {
                if (baseObjects && Array.isArray(baseObjects) && baseObjects.length) {
                    for (let i = 0, len = baseObjects.length; i < len; i++) {
                        const baseObject = baseObjects[i];
                        this._proxyEvent(baseObject);
                    }
                }
                return this;
            }
            /**
             *Events representing the merge
             * @param {*} baseObject
             */
            _proxyEvent(baseObject) {
                baseObject.on('add', (e) => {
                    this._showGeometry(e.target, true);
                });
                baseObject.on('remove', (e) => {
                    this._showGeometry(e.target, false);
                });
                baseObject.on('mouseout', (e) => {
                    this._mouseover = false;
                    this.fire('mouseout', Object.assign({}, e, { target: this, selectMesh: (this.getSelectMesh ? this.getSelectMesh() : null) }));
                    // this._showGeometry(e.target, false);
                });
                baseObject.on(EVENTS, (e) => {
                    this.fire(e.type, Object.assign({}, e, { target: this, selectMesh: (this.getSelectMesh ? this.getSelectMesh() : null) }));
                });
            }
            /**
             * Get the index of the monomer to be hidden
             * @param {*} attribute
             */
            _getHideGeometryIndex(attribute) {
                const indexs = [];
                let count = 0;
                for (let i = 0, len = this._geometriesAttributes.length; i < len; i++) {
                    if (this._geometriesAttributes[i].hide === true) {
                        indexs.push(i);
                        count += this._geometriesAttributes[i][attribute].count;
                    }
                }
                return {
                    indexs,
                    count
                };
            }
            /**
             * update geometry attributes
             * @param {*} bufferAttribute
             * @param {*} attribute
             */
            _updateAttribute(bufferAttribute, attribute) {
                const { indexs } = this._getHideGeometryIndex(attribute);
                const array = this._geometryCache.attributes[attribute].array;
                const len = array.length;
                for (let i = 0; i < len; i++) {
                    bufferAttribute.array[i] = array[i];
                }
                let value = NaN;
                if (this.getObject3d() instanceof THREE.LineSegments) {
                    value = 0;
                }
                for (let j = 0; j < indexs.length; j++) {
                    const index = indexs[j];
                    const { start, end } = this._geometriesAttributes[index][attribute];
                    for (let i = start; i < end; i++) {
                        bufferAttribute.array[i] = value;
                    }
                }
                return this;
            }
            /**
             * show or hide monomer
             * @param {*} baseObject
             * @param {*} isHide
             */
            _showGeometry(baseObject, isHide) {
                let index;
                if (baseObject) {
                    index = baseObject.getOptions().index;
                }
                if (index != null) {
                    const geometryAttributes = this._geometriesAttributes[index];
                    const { hide } = geometryAttributes;
                    if (hide === isHide) {
                        return this;
                    }
                    geometryAttributes.hide = isHide;
                    const buffGeom = this.getObject3d().geometry;
                    this._updateAttribute(buffGeom.attributes.position, 'position');
                    // this._updateAttribute(buffGeom.attributes.normal, 'normal', 3);
                    // this._updateAttribute(buffGeom.attributes.color, 'color', 3);
                    // this._updateAttribute(buffGeom.attributes.uv, 'uv', 2);
                    buffGeom.attributes.position.needsUpdate = true;
                    // buffGeom.attributes.color.needsUpdate = true;
                    // buffGeom.attributes.normal.needsUpdate = true;
                    // buffGeom.attributes.uv.needsUpdate = true;
                    this.isHide = isHide;
                }
                return this;
            }
            /**
             * Get selected monomer
             */
            // eslint-disable-next-line consistent-return
            getSelectMesh() {
                const index = this._getIndex();
                if (index != null) {
                    return {
                        data: this._datas[index],
                        baseObject: this._baseObjects[index]
                    };
                }
            }
            _getIndex(faceIndex) {
                if (faceIndex == null) {
                    faceIndex = this.faceIndex || this.index;
                }
                return faceIndex;
            }
            _init() {
                const pick = this.getLayer().getPick();
                this.on('add', () => {
                    pick.add(this.pickObject3d);
                });
                this.on('remove', () => {
                    pick.remove(this.pickObject3d);
                });
            }
            //Different objects need to implement their own methods
            _setPickObject3d() {
                // multiplexing geometry
                const geometry = this._geometryCache || this.getObject3d().geometry.clone();
                const pick = this.getLayer().getPick();
                const { _geometriesAttributes } = this;
                const colors = [];
                for (let i = 0, len = _geometriesAttributes.length; i < len; i++) {
                    const color = pick.getColor();
                    const colorIndex = color.getHex();
                    this._colorMap[colorIndex] = i;
                    const { count } = _geometriesAttributes[i].position;
                    this._datas[i].colorIndex = colorIndex;
                    for (let j = 0; j < count; j++) {
                        colors.push(color.r, color.g, color.b);
                    }
                }
                addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
                // const material = new THREE.MeshBasicMaterial();
                // material.vertexColors = THREE.VertexColors;
                const color = pick.getColor();
                const colorIndex = color.getHex();
                const mesh = new THREE.Mesh(geometry, defaultMaterial);
                mesh.position.copy(this.getObject3d().position);
                mesh['_colorIndex'] = colorIndex;
                this.setPickObject3d(mesh);
            }
        };
    };

    // eslint-disable-next-line quotes
    const workerName = '__maptalks.three__';
    function getWorkerName() {
        return workerName;
    }

    let MeshActor;
    if (maptalks.worker) {
        MeshActor = class extends maptalks.worker.Actor {
            test(info, cb) {
                //send data to worker thread
                this.send(info, null, cb);
            }
            pushQueue(q = {}) {
                const { type, data, callback, layer, key, center, lineStrings } = q;
                let params;
                if (type === 'Polygon') {
                    params = gengerateExtrudePolygons(data, center, layer);
                }
                else if (type === 'LineString') {
                    //todo liness
                    params = gengerateExtrudeLines(data, center, layer, lineStrings);
                }
                this.send({ type, datas: params.datas }, params.transfe, function (err, message) {
                    if (err) {
                        console.error(err);
                    }
                    message.key = key;
                    callback(message);
                });
            }
        };
    }
    var actor;
    function getActor() {
        if (!maptalks.worker) {
            console.error('maptalks.worker is not defined,You can\'t use ThreeVectorTileLayer');
        }
        if (!actor) {
            actor = new MeshActor(getWorkerName());
        }
        return actor;
    }
    /**
     * generate extrudepolygons data for worker
     * @param {*} polygons
     * @param {*} layer
     */
    function gengerateExtrudePolygons(polygons = [], center, layer) {
        const len = polygons.length;
        const datas = [], transfer = [], altCache = {};
        for (let i = 0; i < len; i++) {
            const polygon = polygons[i];
            const data = getPolygonPositions(polygon, layer, center, true);
            for (let j = 0, len1 = data.length; j < len1; j++) {
                const d = data[j];
                for (let m = 0, len2 = d.length; m < len2; m++) {
                    //ring
                    transfer.push(d[m]);
                }
            }
            const properties = (isGeoJSONPolygon(polygon) ? polygon['properties'] : polygon.getProperties() || {});
            let height = properties.height || 1;
            let bottomHeight = properties.bottomHeight || 0;
            if (bottomHeight !== undefined && typeof bottomHeight === 'number' && bottomHeight !== 0) {
                if (altCache[bottomHeight] === undefined) {
                    altCache[bottomHeight] = layer.distanceToVector3(bottomHeight, bottomHeight).x;
                }
                bottomHeight = altCache[bottomHeight];
            }
            if (altCache[height] === undefined) {
                altCache[height] = layer.distanceToVector3(height, height).x;
            }
            height = altCache[height];
            datas.push({
                data,
                height,
                bottomHeight
            });
        }
        return {
            datas,
            transfer
        };
    }
    /**
     * generate ExtrudeLines data for worker
     * @param {*} lineStringList
     * @param {*} center
     * @param {*} layer
     */
    function gengerateExtrudeLines(lineStringList, center, layer, lineStrings) {
        const datas = [], transfer = [], altCache = {};
        const len = lineStringList.length;
        for (let i = 0; i < len; i++) {
            const multiLineString = lineStringList[i];
            const properties = (isGeoJSONLine(lineStrings[i]) ? lineStrings[i]['properties'] : lineStrings[i].getProperties() || {});
            const width = properties.width || 1;
            const height = properties.height || 1;
            let bottomHeight = properties.bottomHeight || 0;
            if (bottomHeight !== undefined && typeof bottomHeight === 'number' && bottomHeight !== 0) {
                if (altCache[bottomHeight] === undefined) {
                    altCache[bottomHeight] = layer.distanceToVector3(bottomHeight, bottomHeight).x;
                }
                bottomHeight = altCache[bottomHeight];
            }
            if (altCache[height] === undefined) {
                altCache[height] = layer.distanceToVector3(height, height).x;
            }
            if (altCache[width] === undefined) {
                altCache[width] = layer.distanceToVector3(width, width).x;
            }
            const data = [];
            for (let j = 0, len1 = multiLineString.length; j < len1; j++) {
                const lineString = multiLineString[j];
                const positionsV = getLinePosition(lineString, layer, center).positionsV;
                const array = new Float32Array(positionsV.length * 2);
                for (let j = 0, len1 = positionsV.length; j < len1; j++) {
                    array[j * 2] = positionsV[j].x;
                    array[j * 2 + 1] = positionsV[j].y;
                }
                transfer.push(array);
                data.push(array);
            }
            datas.push({
                data,
                height: altCache[height],
                width: altCache[width],
                bottomHeight
            });
        }
        return {
            datas,
            transfer
        };
    }

    const OPTIONS$7 = {
        altitude: 0,
        height: 1,
        bottomHeight: 0,
        topColor: null,
        bottomColor: '#2d2f61',
    };
    class ExtrudePolygons extends MergedMixin(BaseObject) {
        constructor(polygons, options, material, layer) {
            if (!Array.isArray(polygons)) {
                polygons = [polygons];
            }
            const len = polygons.length;
            if (len === 0) {
                console.error('polygons is empty');
            }
            // const centers = [];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < len; i++) {
                const polygon = polygons[i];
                const center = (polygon.getCenter ? polygon.getCenter() : getGeoJSONCenter(polygon));
                let x, y;
                if (Array.isArray(center)) {
                    x = center[0];
                    y = center[1];
                }
                else if (center instanceof maptalks.Coordinate) {
                    x = center.x;
                    y = center.y;
                }
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            // Get the center point of the point set
            const center = new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
            options = maptalks.Util.extend({}, OPTIONS$7, options, { layer, polygons, coordinate: center });
            const { topColor, bottomColor, altitude, asynchronous } = options;
            let bufferGeometry;
            const extrudePolygons = [], faceMap = [], geometriesAttributes = [];
            if (asynchronous) {
                var actor = getActor();
                bufferGeometry = getDefaultBufferGeometry();
                actor.pushQueue({
                    type: 'Polygon',
                    layer,
                    key: options.key,
                    center,
                    data: polygons,
                    callback: (e) => {
                        const { faceMap, geometriesAttributes } = e;
                        this._faceMap = faceMap;
                        this._geometriesAttributes = geometriesAttributes;
                        const bufferGeometry = generateBufferGeometry(e);
                        if (topColor) {
                            initVertexColors$1(bufferGeometry, bottomColor, topColor, geometriesAttributes);
                            material.vertexColors = getVertexColors();
                        }
                        const object3d = this.getObject3d();
                        object3d.geometry = bufferGeometry;
                        object3d.material.needsUpdate = true;
                        this._geometryCache = bufferGeometry.clone();
                        this._setPickObject3d();
                        this._init();
                        if (this.isAdd) {
                            const pick = this.getLayer().getPick();
                            pick.add(this.pickObject3d);
                        }
                        this._fire('workerload', { target: this });
                    }
                });
            }
            else {
                const geometries = [];
                let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
                const altCache = {};
                for (let i = 0; i < len; i++) {
                    const polygon = polygons[i];
                    const properties = (isGeoJSONPolygon(polygon) ? polygon['properties'] : polygon.getProperties() || {});
                    const height = properties.height || 1;
                    const bottomHeight = properties.bottomHeight || 0;
                    const buffGeom = getExtrudeGeometryParams(polygon, height, layer, center, altCache);
                    geometries.push(buffGeom);
                    const minZ = setBottomHeight(buffGeom, bottomHeight, layer, altCache);
                    // const extrudePolygon = new ExtrudePolygon(polygon, Object.assign({}, options, { height, index: i }), material, layer);
                    // extrudePolygons.push(extrudePolygon);
                    const { position, normal, uv, indices } = buffGeom;
                    const faceLen = indices.length / 3;
                    faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                    faceIndex += faceLen;
                    const psCount = position.length / 3, 
                    //  colorCount = buffGeom.attributes.color.count,
                    normalCount = normal.length / 3, uvCount = uv.length / 2;
                    geometriesAttributes[i] = {
                        position: {
                            middleZ: minZ + altCache[height] / 2,
                            count: psCount,
                            start: psIndex,
                            end: psIndex + psCount * 3,
                        },
                        normal: {
                            count: normalCount,
                            start: normalIndex,
                            end: normalIndex + normalCount * 3,
                        },
                        // color: {
                        //     count: colorCount,
                        //     start: colorIndex,
                        //     end: colorIndex + colorCount * 3,
                        // },
                        uv: {
                            count: uvCount,
                            start: uvIndex,
                            end: uvIndex + uvCount * 2,
                        },
                        hide: false
                    };
                    psIndex += psCount * 3;
                    normalIndex += normalCount * 3;
                    // colorIndex += colorCount * 3;
                    uvIndex += uvCount * 2;
                }
                bufferGeometry = mergeBufferGeometries(geometries);
                if (topColor) {
                    initVertexColors$1(bufferGeometry, bottomColor, topColor, geometriesAttributes);
                    material.vertexColors = getVertexColors();
                }
            }
            super();
            this._initOptions(options);
            this._createMesh(bufferGeometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            //Face corresponding to monomer
            this._faceMap = faceMap;
            this._baseObjects = extrudePolygons;
            this._datas = polygons;
            this._geometriesAttributes = geometriesAttributes;
            this.faceIndex = null;
            this._geometryCache = bufferGeometry.clone();
            this.isHide = false;
            this._colorMap = {};
            this._initBaseObjectsEvent(extrudePolygons);
            if (!asynchronous) {
                this._setPickObject3d();
                this._init();
            }
            this.type = 'ExtrudePolygons';
        }
        // eslint-disable-next-line consistent-return
        getSelectMesh() {
            const index = this._getIndex();
            if (index != null) {
                if (!this._baseObjects[index]) {
                    const polygon = this._datas[index];
                    const opts = Object.assign({}, this.options, isGeoJSONPolygon(polygon) ? polygon.properties : polygon.getProperties(), { index });
                    this._baseObjects[index] = new ExtrudePolygon(polygon, opts, this.getObject3d().material, this.getLayer());
                    this._proxyEvent(this._baseObjects[index]);
                }
                return {
                    data: this._datas[index],
                    baseObject: this._baseObjects[index]
                };
            }
        }
        // eslint-disable-next-line no-unused-vars
        identify(coordinate) {
            return this.picked;
        }
    }

    function positionsConvert(worldPoints, altitude = 0, layer) {
        const vectors = [], cache = {};
        for (let i = 0, len = worldPoints.length; i < len; i += 3) {
            let x = worldPoints[i], y = worldPoints[i + 1], z = worldPoints[i + 2];
            if (altitude > 0) {
                z += distanceToVector3(altitude, layer, cache);
            }
            vectors.push(new THREE.Vector3(x, y, z));
        }
        return vectors;
    }
    function vectors2Pixel(worldPoints, size, camera, altitude = 0, layer) {
        if (!(worldPoints[0] instanceof THREE.Vector3)) {
            worldPoints = positionsConvert(worldPoints, altitude, layer);
        }
        const pixels = worldPoints.map(worldPoint => {
            return vector2Pixel(worldPoint, size, camera);
        });
        return pixels;
    }
    // eslint-disable-next-line camelcase
    function vector2Pixel(world_vector, size, camera) {
        // eslint-disable-next-line camelcase
        const vector = world_vector.project(camera);
        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;
        const result = {
            x: Math.round(vector.x * halfWidth + halfWidth),
            y: Math.round(-vector.y * halfHeight + halfHeight)
        };
        return result;
    }

    var IdentifyUtil = /*#__PURE__*/Object.freeze({
        __proto__: null,
        vectors2Pixel: vectors2Pixel,
        vector2Pixel: vector2Pixel
    });

    const OPTIONS$8 = {
        altitude: 0,
        height: 0,
        color: null
    };
    const vector = new THREE.Vector3();
    class Point extends BaseObject {
        constructor(coordinate, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$8, options, { layer, coordinate });
            super();
            let { height, altitude, color, size } = options;
            const vs = [], colors = [];
            if (color) {
                color = (color instanceof THREE.Color ? color : new THREE.Color(color));
                colors.push(color.r, color.g, color.b);
            }
            const z = layer.distanceToVector3(height, height).x;
            const v = layer.coordinateToVector3(coordinate, z);
            vs.push(0, 0, v.z);
            const geometry = new THREE.BufferGeometry();
            addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(vs, 3, true));
            if (colors.length) {
                addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
            }
            if (size !== undefined) {
                addAttribute(geometry, 'size', new THREE.Float32BufferAttribute([size], 1, true));
            }
            options.positions = v;
            this._initOptions(options);
            this._createPoints(geometry, material);
            const z1 = layer.distanceToVector3(altitude, altitude).x;
            const v1 = new THREE.Vector3(v.x, v.y, z1);
            this.getObject3d().position.copy(v1);
            this.type = 'Point';
        }
        /**
         *
         * @param {maptalks.Coordinate} coordinate
         */
        identify(coordinate) {
            const layer = this.getLayer(), size = this.getMap().getSize(), camera = this.getLayer().getCamera(), positions = this.getOptions().positions, altitude = this.getOptions().altitude;
            //Size of points
            let pointSize = this.getObject3d().material.size;
            if (pointSize === undefined) {
                pointSize = this.options.size || 1;
            }
            const pixel = this.getMap().coordToContainerPoint(coordinate);
            const z = layer.distanceToVector3(altitude, altitude).x;
            vector.x = positions.x;
            vector.y = positions.y;
            vector.z = positions.z + z;
            //3D vector to screen coordinates
            const p = vector2Pixel(vector, size, camera);
            //Distance between two points
            const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
            return (distance <= pointSize / 2);
        }
    }

    const ROW = 30, COL = 30;
    function contains(b, p) {
        const { minx, miny, maxx, maxy } = b;
        const [x, y] = p;
        if (minx <= x && x <= maxx && miny <= y && y <= maxy) {
            return true;
        }
        return false;
    }
    class BBox {
        constructor(minlng, minlat, maxlng, maxlat) {
            this.minlng = minlng;
            this.minlat = minlat;
            this.maxlng = maxlng;
            this.maxlat = maxlat;
            this.minx = Infinity;
            this.miny = Infinity;
            this.maxx = -Infinity;
            this.maxy = -Infinity;
            this.coordinates = [];
            this.positions = [];
            this.indexs = [];
            this.key = null;
        }
        /**
         *
         * @param {*} map
         */
        updateBBoxPixel(map) {
            let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
            const { minlng, minlat, maxlng, maxlat } = this;
            [
                [minlng, minlat],
                [minlng, maxlat],
                [maxlng, minlat],
                [maxlng, maxlat]
            ].map(lnglat => {
                return new maptalks.Coordinate(lnglat);
            }).map(coordinate => {
                return map.coordToContainerPoint(coordinate);
            }).forEach(pixel => {
                minx = Math.min(minx, pixel.x);
                miny = Math.min(miny, pixel.y);
                maxx = Math.max(maxx, pixel.x);
                maxy = Math.max(maxy, pixel.y);
            });
            this.minx = minx;
            this.miny = miny;
            this.maxx = maxx;
            this.maxy = maxy;
            return this;
        }
        /**
         *Determine whether a point is included
         * @param {*} c
         */
        containsCoordinate(c) {
            let lng, lat;
            if (Array.isArray(c)) {
                lng = c[0];
                lat = c[1];
            }
            else if (c instanceof maptalks.Coordinate) {
                lng = c.x;
                lat = c.y;
            }
            const { minlng, minlat, maxlng, maxlat } = this;
            return (minlng <= lng && lng <= maxlng && minlat <= lat && lat <= maxlat);
        }
        /**
         *Judge rectangle intersection
         * @param {*} pixel
         * @param {*} size
         */
        isRecCross(pixel, size) {
            const { x, y } = pixel;
            const rec = {
                minx: x - size / 2,
                miny: y - size / 2,
                maxx: x + size / 2,
                maxy: y + size / 2
            };
            const { minx, miny, maxx, maxy } = rec;
            if (contains(this, [minx, miny]) ||
                contains(this, [minx, maxy]) ||
                contains(this, [maxx, miny]) ||
                contains(this, [maxx, maxy]) ||
                contains(rec, [this.minx, this.miny]) ||
                contains(rec, [this.minx, this.maxy]) ||
                contains(rec, [this.maxx, this.miny]) ||
                contains(rec, [this.maxx, this.maxy])) {
                return true;
            }
            return false;
        }
        /**
         *generate grids
         * @param {*} minlng
         * @param {*} minlat
         * @param {*} maxlng
         * @param {*} maxlat
         */
        static initGrids(minlng, minlat, maxlng, maxlat) {
            const grids = [], offsetX = maxlng - minlng, offsetY = maxlat - minlat;
            const averageX = offsetX / COL, averageY = offsetY / ROW;
            let x = minlng, y = minlat;
            for (let i = 0; i < COL; i++) {
                x = minlng + i * averageX;
                for (let j = 0; j < ROW; j++) {
                    y = minlat + j * averageY;
                    const bounds = new BBox(x, y, x + averageX, y + averageY);
                    bounds.key = j + '-' + i;
                    grids.push(bounds);
                }
            }
            return grids;
        }
    }

    const OPTIONS$9 = {
        altitude: 0
    };
    const vector$1 = new THREE.Vector3();
    /**
     *points
     */
    class Points extends MergedMixin(BaseObject) {
        constructor(points, options, material, layer) {
            if (!Array.isArray(points)) {
                points = [points];
            }
            options = maptalks.Util.extend({}, OPTIONS$9, options, { layer, points });
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0, len = points.length; i < len; i++) {
                const { coordinate } = points[i];
                let x, y;
                if (Array.isArray(coordinate)) {
                    x = coordinate[0];
                    y = coordinate[1];
                }
                else if (coordinate instanceof maptalks.Coordinate) {
                    x = coordinate.x;
                    y = coordinate.y;
                }
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            const centerPt = layer.coordinateToVector3([(minX + maxX) / 2, (minY + maxY) / 2]);
            const grids = BBox.initGrids(minX, minY, maxX, maxY);
            const gridslen = grids.length;
            const vs = [], vectors = [], colors = [], sizes = [], pointMeshes = [], geometriesAttributes = [];
            const cache = {};
            let maxSize = 0;
            for (let i = 0, len = points.length; i < len; i++) {
                let { coordinate, height, color, size } = points[i];
                if (color) {
                    color = (color instanceof THREE.Color ? color : new THREE.Color(color));
                    colors.push(color.r, color.g, color.b);
                }
                if (size) {
                    sizes.push(size);
                    maxSize = Math.max(maxSize, size);
                }
                const z = distanceToVector3(height, layer, cache);
                const v = layer.coordinateToVector3(coordinate, z);
                const v1 = v.clone().sub(centerPt);
                vs.push(v1.x, v1.y, v1.z);
                vectors.push(v);
                geometriesAttributes[i] = {
                    position: {
                        count: 1,
                        start: i * 3,
                        end: i * 3 + 3
                    },
                    hide: false
                };
                for (let j = 0; j < gridslen; j++) {
                    if (grids[j].containsCoordinate(coordinate)) {
                        // grids[j].coordinates.push(coordinate);
                        grids[j].positions.push(v);
                        grids[j].indexs.push(i);
                        break;
                    }
                }
            }
            const geometry = new THREE.BufferGeometry();
            addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(vs, 3, true));
            if (colors.length) {
                addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
            }
            if (sizes.length) {
                addAttribute(geometry, 'size', new THREE.Float32BufferAttribute(sizes, 1, true));
            }
            //for identify
            options.positions = vectors;
            super();
            this._initOptions(options);
            this._createPoints(geometry, material);
            const altitude = options.altitude;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = centerPt.clone();
            v.z = z;
            this.getObject3d().position.copy(v);
            this._baseObjects = pointMeshes;
            this._datas = points;
            this.faceIndex = null;
            this._geometriesAttributes = geometriesAttributes;
            this._geometryCache = geometry.clone();
            this.isHide = false;
            this._initBaseObjectsEvent(pointMeshes);
            this._grids = grids;
            this._bindMapEvents();
            this.type = 'Points';
            this.maxSize = maxSize;
        }
        _bindMapEvents() {
            const map = this.getMap();
            const events = 'zoomstart zooming zoomend movestart moving moveend pitch rotate';
            this.on('add', () => {
                this._updateGrids();
                map.on(events, this._updateGrids, this);
            });
            this.on('remove', () => {
                map.off(events, this._updateGrids, this);
            });
        }
        _updateGrids() {
            const map = this.getMap();
            this._grids.forEach(b => {
                if (b.indexs.length) {
                    b.updateBBoxPixel(map);
                }
            });
        }
        // eslint-disable-next-line consistent-return
        getSelectMesh() {
            const index = this.faceIndex;
            if (index != null) {
                if (!this._baseObjects[index]) {
                    const data = this._datas[index];
                    const { coordinate, height, color, size } = data;
                    this._baseObjects[index] = new Point(coordinate, { height, index, color, size }, this.getObject3d().material, this.getLayer());
                    this._proxyEvent(this._baseObjects[index]);
                }
                return {
                    data: this._datas[index],
                    baseObject: this._baseObjects[index]
                };
            }
        }
        /**
       *
       * @param {maptalks.Coordinate} coordinate
       */
        identify(coordinate) {
            const layer = this.getLayer(), size = this.getMap().getSize(), camera = this.getLayer().getCamera(), altitude = this.getOptions().altitude, map = this.getMap();
            const z = layer.distanceToVector3(altitude, altitude).x;
            let pointSize = this.getObject3d().material.size;
            const isDynamicSize = pointSize === undefined;
            const pixel = map.coordToContainerPoint(coordinate);
            const bs = [];
            this._grids.forEach(b => {
                if (b.indexs.length) {
                    if (b.isRecCross(pixel, isDynamicSize ? this.maxSize : pointSize)) {
                        bs.push(b);
                    }
                }
            });
            if (bs.length < 1) {
                return false;
            }
            for (let i = 0, len = bs.length; i < len; i++) {
                for (let len1 = bs[i].positions.length, j = len1 - 1; j >= 0; j--) {
                    if (isDynamicSize) {
                        pointSize = this._datas[bs[i].indexs[j]].size || 1;
                    }
                    const v = bs[i].positions[j];
                    vector$1.x = v.x;
                    vector$1.y = v.y;
                    vector$1.z = v.z + z;
                    const p = vector2Pixel(vector$1, size, camera);
                    const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
                    if (distance <= pointSize / 2) {
                        this.faceIndex = bs[i].indexs[j];
                        return true;
                    }
                }
            }
            return false;
        }
    }

    const OPTIONS$a = {
        coordinate: '',
        radius: 10,
        height: 100,
        radialSegments: 6,
        altitude: 0,
        topColor: '',
        bottomColor: '#2d2f61',
    };
    /**
     * merged bars
     */
    class Bars extends MergedMixin(BaseObject) {
        constructor(points, options, material, layer) {
            if (!Array.isArray(points)) {
                points = [points];
            }
            const len = points.length;
            const center = getCenterOfPoints(points);
            const centerPt = layer.coordinateToVector3(center);
            const geometries = [], bars = [], geometriesAttributes = [], faceMap = [];
            let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
            const cache = {};
            for (let i = 0; i < len; i++) {
                const opts = maptalks.Util.extend({ index: i }, OPTIONS$a, points[i]);
                const { radius, radialSegments, altitude, topColor, bottomColor, height, coordinate } = opts;
                const r = distanceToVector3(radius, layer, cache);
                const h = distanceToVector3(height, layer, cache);
                const alt = distanceToVector3(altitude, layer, cache);
                const buffGeom = getGeometry({ radius: r, height: h, radialSegments });
                if (topColor) {
                    initVertexColors(buffGeom, bottomColor, topColor, 'z', h / 2);
                    material.vertexColors = getVertexColors();
                }
                // buffGeom.rotateX(Math.PI / 2);
                const v = layer.coordinateToVector3(coordinate).sub(centerPt);
                const parray = buffGeom.attributes.position.array;
                for (let j = 0, len1 = parray.length; j < len1; j += 3) {
                    parray[j + 2] += alt;
                    parray[j] += v.x;
                    parray[j + 1] += v.y;
                    parray[j + 2] += v.z;
                }
                geometries.push(buffGeom);
                const bar = new Bar(coordinate, opts, material, layer);
                bars.push(bar);
                const faceLen = buffGeom.index.count / 3;
                faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                faceIndex += faceLen;
                const psCount = buffGeom.attributes.position.count, 
                //  colorCount = buffGeom.attributes.color.count,
                normalCount = buffGeom.attributes.normal.count, uvCount = buffGeom.attributes.uv.count;
                geometriesAttributes[i] = {
                    position: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    normal: {
                        count: normalCount,
                        start: normalIndex,
                        end: normalIndex + normalCount * 3,
                    },
                    // color: {
                    //     count: colorCount,
                    //     start: colorIndex,
                    //     end: colorIndex + colorCount * 3,
                    // },
                    uv: {
                        count: uvCount,
                        start: uvIndex,
                        end: uvIndex + uvCount * 2,
                    },
                    hide: false
                };
                psIndex += psCount * 3;
                normalIndex += normalCount * 3;
                // colorIndex += colorCount * 3;
                uvIndex += uvCount * 2;
            }
            super();
            options = maptalks.Util.extend({}, { altitude: 0, layer, points }, options);
            this._initOptions(options);
            const geometry = mergeBarGeometry(geometries);
            this._createMesh(geometry, material);
            const altitude = options.altitude;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = centerPt.clone();
            v.z = z;
            this.getObject3d().position.copy(v);
            this._faceMap = faceMap;
            this._baseObjects = bars;
            this._datas = points;
            this._geometriesAttributes = geometriesAttributes;
            this.faceIndex = null;
            this._geometryCache = geometry.clone();
            this.isHide = false;
            this._colorMap = {};
            this._initBaseObjectsEvent(bars);
            this._setPickObject3d();
            this._init();
            this.type = 'Bars';
        }
        // eslint-disable-next-line no-unused-vars
        identify() {
            return this.picked;
        }
    }

    const OPTIONS$b = {
        width: 3,
        height: 1,
        altitude: 0,
        topColor: null,
        bottomColor: '#2d2f61'
    };
    class ExtrudeLines extends MergedMixin(BaseObject) {
        constructor(lineStrings, options, material, layer) {
            if (!Array.isArray(lineStrings)) {
                lineStrings = [lineStrings];
            }
            const centers = [], lineStringList = [];
            const len = lineStrings.length;
            for (let i = 0; i < len; i++) {
                const lineString = lineStrings[i];
                const result = LineStringSplit(lineString);
                centers.push(result.center);
                lineStringList.push(result.lineStrings);
            }
            // Get the center point of the point set
            const center = getCenterOfPoints(centers);
            options = maptalks.Util.extend({}, OPTIONS$b, options, { layer, lineStrings, coordinate: center });
            const { altitude, topColor, bottomColor, asynchronous } = options;
            let bufferGeometry;
            const faceMap = [], extrudeLines = [], geometriesAttributes = [];
            if (asynchronous) {
                var actor = getActor();
                bufferGeometry = getDefaultBufferGeometry();
                actor.pushQueue({
                    type: 'LineString',
                    layer,
                    key: options.key,
                    center,
                    data: lineStringList,
                    lineStrings,
                    callback: (e) => {
                        const { faceMap, geometriesAttributes } = e;
                        this._faceMap = faceMap;
                        this._geometriesAttributes = geometriesAttributes;
                        const bufferGeometry = generateBufferGeometry(e);
                        if (topColor) {
                            initVertexColors$1(bufferGeometry, bottomColor, topColor, geometriesAttributes);
                            material.vertexColors = getVertexColors();
                        }
                        this.getObject3d().geometry = bufferGeometry;
                        this.getObject3d().material.needsUpdate = true;
                        this._geometryCache = bufferGeometry.clone();
                        this._setPickObject3d();
                        this._init();
                        if (this.isAdd) {
                            const pick = this.getLayer().getPick();
                            pick.add(this.pickObject3d);
                        }
                        this._fire('workerload', { target: this });
                    }
                });
            }
            else {
                const geometries = [];
                let faceIndex = 0, faceMap = [], psIndex = 0, normalIndex = 0;
                const cache = {};
                for (let i = 0; i < len; i++) {
                    const lineString = lineStrings[i];
                    const opts = maptalks.Util.extend({}, OPTIONS$b, isGeoJSON(lineString) ? lineString['properties'] : lineString.getProperties(), { index: i });
                    const { height, width, bottomHeight } = opts;
                    const w = distanceToVector3(width, layer, cache);
                    const h = distanceToVector3(height, layer, cache);
                    const lls = lineStringList[i];
                    const extrudeParams = [];
                    let minZ = 0;
                    for (let m = 0, le = lls.length; m < le; m++) {
                        const attribute = getExtrudeLineParams(lls[m], w, h, layer, center);
                        minZ = setBottomHeight(attribute, bottomHeight, layer, cache);
                        extrudeParams.push(attribute);
                    }
                    const buffGeom = mergeBufferGeometriesAttribute(extrudeParams);
                    geometries.push(buffGeom);
                    // const extrudeLine = new ExtrudeLine(lineString, opts, material, layer);
                    // extrudeLines.push(extrudeLine);
                    const { position, normal, indices } = buffGeom;
                    const faceLen = indices.length / 3;
                    faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                    faceIndex += faceLen;
                    const psCount = position.length / 3, 
                    //  colorCount = buffGeom.attributes.color.count,
                    normalCount = normal.length / 3;
                    geometriesAttributes[i] = {
                        position: {
                            middleZ: minZ + h / 2,
                            count: psCount,
                            start: psIndex,
                            end: psIndex + psCount * 3,
                        },
                        normal: {
                            count: normalCount,
                            start: normalIndex,
                            end: normalIndex + normalCount * 3,
                        },
                        // color: {
                        //     count: colorCount,
                        //     start: colorIndex,
                        //     end: colorIndex + colorCount * 3,
                        // },
                        // uv: {
                        //     count: uvCount,
                        //     start: uvIndex,
                        //     end: uvIndex + uvCount * 2,
                        // },
                        hide: false
                    };
                    psIndex += psCount * 3;
                    normalIndex += normalCount * 3;
                    // colorIndex += colorCount * 3;
                    // uvIndex += uvCount * 2;
                }
                bufferGeometry = mergeBufferGeometries(geometries);
                if (topColor) {
                    initVertexColors$1(bufferGeometry, bottomColor, topColor, geometriesAttributes);
                    material.vertexColors = getVertexColors();
                }
            }
            super();
            this._initOptions(options);
            this._createMesh(bufferGeometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            //Face corresponding to monomer
            this._faceMap = faceMap;
            this._baseObjects = extrudeLines;
            this._datas = lineStrings;
            this._geometriesAttributes = geometriesAttributes;
            this.faceIndex = null;
            this._geometryCache = bufferGeometry.clone();
            this.isHide = false;
            this._colorMap = {};
            this._initBaseObjectsEvent(extrudeLines);
            if (!asynchronous) {
                this._setPickObject3d();
                this._init();
            }
            this.type = 'ExtrudeLines';
        }
        // eslint-disable-next-line consistent-return
        getSelectMesh() {
            const index = this._getIndex();
            if (index != null) {
                if (!this._baseObjects[index]) {
                    const lineString = this._datas[index];
                    const opts = Object.assign({}, this.options, isGeoJSONLine(lineString) ? lineString.properties : lineString.getProperties(), { index });
                    this._baseObjects[index] = new ExtrudeLine(lineString, opts, this.getObject3d().material, this.getLayer());
                    this._proxyEvent(this._baseObjects[index]);
                }
                return {
                    data: this._datas[index],
                    baseObject: this._baseObjects[index]
                };
            }
        }
        // eslint-disable-next-line no-unused-vars
        identify(coordinate) {
            return this.picked;
        }
    }

    const OPTIONS$c = {
        altitude: 0,
        colors: null
    };
    /**
     *
     */
    class Lines extends MergedMixin(BaseObject) {
        constructor(lineStrings, options, material, layer) {
            if (!Array.isArray(lineStrings)) {
                lineStrings = [lineStrings];
            }
            const centers = [], lineStringList = [];
            const len = lineStrings.length;
            for (let i = 0; i < len; i++) {
                const lineString = lineStrings[i];
                const result = LineStringSplit(lineString);
                centers.push(result.center);
                lineStringList.push(result.lineStrings);
            }
            // Get the center point of the point set
            const center = getCenterOfPoints(centers);
            options = maptalks.Util.extend({}, OPTIONS$c, options, { layer, lineStrings, coordinate: center });
            const lines = [], cache = {};
            let faceIndex = 0, faceMap = [], geometriesAttributes = [], psIndex = 0, ps = [];
            for (let i = 0; i < len; i++) {
                const lls = lineStringList[i];
                let psCount = 0;
                for (let m = 0, le = lls.length; m < le; m++) {
                    const properties = (isGeoJSONLine(lls[m]) ? lls[m]['properties'] : lls[m].getProperties() || {});
                    const { positionsV } = getLinePosition(lls[m], layer, center);
                    setBottomHeight(positionsV, properties.bottomHeight, layer, cache);
                    psCount += (positionsV.length * 2 - 2);
                    for (let j = 0, len1 = positionsV.length; j < len1; j++) {
                        const v = positionsV[j];
                        if (j > 0 && j < len1 - 1) {
                            ps.push(v.x, v.y, v.z);
                        }
                        ps.push(v.x, v.y, v.z);
                    }
                }
                // const line = new Line(lineString, opts, material, layer);
                // lines.push(line);
                // const psCount = positionsV.length + positionsV.length - 2;
                const faceLen = psCount;
                faceMap[i] = [faceIndex, faceIndex + faceLen];
                faceIndex += faceLen;
                geometriesAttributes[i] = {
                    position: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    hide: false
                };
                psIndex += psCount * 3;
            }
            const geometry = new THREE.BufferGeometry();
            addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(ps, 3));
            super();
            this._initOptions(options);
            this._createLineSegments(geometry, material);
            const { altitude } = options;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this._faceMap = faceMap;
            this._baseObjects = lines;
            this._datas = lineStrings;
            this._geometriesAttributes = geometriesAttributes;
            this.faceIndex = null;
            this.index = null;
            this._geometryCache = geometry.clone();
            this.isHide = false;
            this._colorMap = {};
            this._initBaseObjectsEvent(lines);
            this._setPickObject3d();
            this._init();
            this.type = 'Lines';
        }
        // eslint-disable-next-line consistent-return
        getSelectMesh() {
            const index = this._getIndex();
            if (index != null) {
                if (!this._baseObjects[index]) {
                    const lineString = this._datas[index];
                    const opts = maptalks.Util.extend({}, this.getOptions(), { index }, isGeoJSONLine(lineString) ? lineString.properties : lineString.getProperties());
                    this._baseObjects[index] = new Line(lineString, opts, this.getObject3d().material, this.getLayer());
                    this._proxyEvent(this._baseObjects[index]);
                }
                return {
                    data: this._datas[index],
                    baseObject: this._baseObjects[index]
                };
            }
        }
        _setPickObject3d() {
            const geometry = this._geometryCache || this.getObject3d().geometry.clone();
            const pick = this.getLayer().getPick();
            const { _geometriesAttributes } = this;
            const colors = [];
            for (let i = 0, len = _geometriesAttributes.length; i < len; i++) {
                const color = pick.getColor();
                const colorIndex = color.getHex();
                this._colorMap[colorIndex] = i;
                const { count } = _geometriesAttributes[i].position;
                this._datas[i].colorIndex = colorIndex;
                for (let j = 0; j < count; j++) {
                    colors.push(color.r, color.g, color.b);
                }
            }
            addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
            const material = this.getObject3d().material.clone();
            material.color.set('#fff');
            material.vertexColors = getVertexColors();
            const color = pick.getColor();
            const colorIndex = color.getHex();
            const mesh = new THREE.LineSegments(geometry, material);
            mesh.position.copy(this.getObject3d().position);
            mesh['_colorIndex'] = colorIndex;
            this.setPickObject3d(mesh);
        }
        // eslint-disable-next-line no-unused-vars
        identify(coordinate) {
            return this.picked;
        }
    }

    /*

    Global sharing

    */
    //Maximum concurrent
    const MAX = 10;
    const waitingQueue = [];
    const currentQueue = [];
    function getQueues() {
        return {
            waitingQueue,
            currentQueue
        };
    }
    /**
     *
     * @param {*} key
     * @param {*} url
     * @param {*} callback
     * @param {*} img
     * @param {*} vt
     */
    function pushQueue(key, url, callback, img, vt) {
        // url += `?key=${key}`;
        const q = {
            key,
            url,
            callback,
            img,
            vt
        };
        if (currentQueue.length < MAX) {
            currentQueue.push(q);
            vt.loopMessage(q);
        }
        else {
            waitingQueue.push(q);
        }
    }
    /**
     *
     * @param {*} index
     */
    function outQueue(index) {
        const callback = deleteQueueItem(waitingQueue, index);
        if (callback) {
            callback(index);
        }
    }
    /**
     *
     * @param {*} queArray
     * @param {*} index
     */
    function deleteQueueItem(queArray, index) {
        for (let i = 0, len = queArray.length; i < len; i++) {
            const q = queArray[i];
            if (q) {
                const { key, callback } = q;
                if (index === key) {
                    queArray.splice(i, 1);
                    return callback;
                }
            }
        }
        return null;
    }
    /**
     *
     * @param {*} key
     * @param {*} vt
     */
    function nextLoop(key, vt) {
        deleteQueueItem(currentQueue, key);
        if (waitingQueue.length) {
            currentQueue.push(waitingQueue[0]);
            waitingQueue.splice(0, 1);
            const last = currentQueue[currentQueue.length - 1];
            vt.loopMessage(last);
        }
    }

    const canvas = document.createElement('canvas');
    const SIZE = 256;
    canvas.width = canvas.height = SIZE;
    function generateImage(key, debug = false) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.save();
        if (debug) {
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'rgba(255,0,0,0.4)';
            ctx.lineWidth = 0.2;
            const text = key || 'tile';
            ctx.font = '18px sans-serif';
            ctx.rect(0, 0, SIZE, SIZE);
            ctx.stroke();
            ctx.fillText(text, 15, SIZE / 2);
        }
        return canvas.toDataURL();
    }
    function createCanvas(width = 1, height = 1) {
        let canvas;
        if (typeof document === 'undefined') ;
        else {
            canvas = document.createElement('canvas');
            if (width) {
                canvas.width = width;
            }
            if (height) {
                canvas.height = height;
            }
        }
        return canvas;
    }

    /**
     *
     */
    class BaseVectorTileLayer extends maptalks.TileLayer {
        constructor(url, options = {}) {
            super(maptalks.Util.GUID(), maptalks.Util.extend({ urlTemplate: url }, options));
            this._opts = null;
            this._layer = null;
            this.material = null;
            this.getMaterial = null;
            this._baseObjectKeys = {};
            this._loadTiles = {};
            this._add = null;
            this._layerLaodTime = new Date().getTime();
        }
        isAsynchronous() {
            return this._opts.worker;
        }
        /**
         *get current all baseobject
         */
        getBaseObjects() {
            const loadTiles = this._loadTiles;
            const baseos = [];
            for (let key in loadTiles) {
                const baseobjects = this._baseObjectKeys[key];
                if (baseobjects && Array.isArray(baseobjects) && baseobjects.length) {
                    for (let i = 0, len = baseobjects.length; i < len; i++) {
                        baseos.push(baseobjects[i]);
                    }
                }
            }
            return baseos;
        }
        /**
       * This method should be overridden for event handling
       * @param {*} type
       * @param {*} e
       */
        // eslint-disable-next-line no-unused-vars
        onSelectMesh(type, e) {
        }
        /**
       * this is can override
       * @param {*} index
       * @param {*} json
       */
        // eslint-disable-next-line no-unused-vars
        formatBaseObjects(index, json) {
            return [];
        }
        //queue loop
        // eslint-disable-next-line no-unused-vars
        loopMessage(q) {
        }
        /**
        *
        * @param {*} q
        */
        getTileData(q) {
            const { key, url, callback, img } = q;
            maptalks.Ajax.getJSON(url, {}, function (error, res) {
                if (error) {
                    console.error(error);
                    callback(key, null, img);
                }
                else {
                    callback(key, res, img);
                }
            });
        }
        _getCurentTileKeys() {
            const tileGrids = this.getTiles().tileGrids || [];
            const keys = [], keysMap = {};
            for (let i = 0, len = tileGrids.length; i < len; i++) {
                const d = tileGrids[i];
                const tiles = d.tiles || [];
                for (let j = 0, len1 = tiles.length; j < len1; j++) {
                    const { id } = tiles[j];
                    keys.push(id);
                    keysMap[id] = true;
                }
            }
            return { keys, keysMap };
        }
        _isLoad() {
            const { keys } = this._getCurentTileKeys();
            const keys1 = Object.keys(this._renderer.tilesInView);
            if (keys.length === keys1.length) {
                return true;
            }
            return false;
        }
        _layerOnLoad() {
            // This event will be triggered multiple times per unit time
            const time = new Date().getTime();
            const offsetTime = time - this._layerLaodTime;
            if (offsetTime < 20) {
                return;
            }
            this._layerLaodTime = time;
            const tilesInView = this._renderer.tilesInView, loadTiles = this._loadTiles, threeLayer = this._layer, keys = this._baseObjectKeys;
            const tilesInViewLen = Object.keys(tilesInView).length, loadTilesLen = Object.keys(loadTiles).length;
            const needsRemoveBaseObjects = [];
            if (tilesInViewLen && loadTilesLen) {
                for (let index in loadTiles) {
                    if (!tilesInView[index]) {
                        if (keys[index]) {
                            (keys[index] || []).forEach(baseobject => {
                                needsRemoveBaseObjects.push(baseobject);
                            });
                        }
                    }
                }
            }
            if (needsRemoveBaseObjects.length) {
                threeLayer.removeMesh(needsRemoveBaseObjects, false);
            }
            if (tilesInViewLen && loadTilesLen) {
                for (let index in tilesInView) {
                    if (!loadTiles[index]) {
                        if (keys[index]) {
                            const baseobject = keys[index];
                            threeLayer.addMesh(baseobject);
                        }
                        else {
                            const { x, y, z } = this._getXYZOfIndex(index);
                            this.getTileUrl(x, y, z);
                        }
                    }
                }
            }
            this._loadTiles = Object.assign({}, tilesInView);
            this._diffCache();
        }
        _init() {
        }
        _workerLoad(e) {
            const baseobject = e.target;
            const img = baseobject._img;
            img.currentCount++;
            if (img.currentCount === img.needCount) {
                img.src = generateImage(img._key, this._opts.debug);
            }
        }
        _generateBaseObjects(index, res, img) {
            if (res && img) {
                const { keysMap } = this._getCurentTileKeys();
                //not in current ,ignore
                if (!keysMap[index]) {
                    img.src = generateImage(index, this._opts.debug);
                    return;
                }
                const baseobjects = this.formatBaseObjects(index, res);
                if (baseobjects.length) {
                    img.needCount = baseobjects.length;
                    img.currentCount = 0;
                    for (let i = 0, len = baseobjects.length; i < len; i++) {
                        const baseobject = baseobjects[i];
                        baseobject._img = img;
                        baseobject._vt = this;
                        if (!this.isVisible()) {
                            baseobject.hide();
                        }
                        this._cachetile(index, baseobject);
                        if (!baseobject.isAsynchronous()) {
                            img.currentCount++;
                        }
                    }
                    this._layer.addMesh(baseobjects, false);
                    if (img.needCount === img.currentCount) {
                        img.src = generateImage(index, this._opts.debug);
                    }
                    if (this.isAsynchronous()) {
                        baseobjects.filter(baseobject => {
                            return baseobject.isAsynchronous();
                        }).forEach(baseobject => {
                            baseobject.on('workerload', this._workerLoad, this);
                        });
                    }
                    else {
                        img.src = generateImage(index, this._opts.debug);
                    }
                }
                else {
                    img.src = generateImage(index, this._opts.debug);
                }
                this._loadTiles[index] = true;
            }
            else if (img) {
                img.src = generateImage(index, this._opts.debug);
            }
        }
        _diffCache() {
            // if (this._layer.getMap().isInteracting()) {
            //     return;
            // }
            if (Object.keys(this._baseObjectKeys).length > this._renderer.tileCache.max) {
                const tileCache = this._renderer.tileCache.data;
                const tilesInView = this._renderer.tilesInView;
                const needsRemoveBaseObjects = [];
                for (let index in this._baseObjectKeys) {
                    if (!tileCache[index] && !tilesInView[index]) {
                        (this._baseObjectKeys[index] || []).forEach(baseobject => {
                            if (baseobject.isAdd) {
                                needsRemoveBaseObjects.push(baseobject);
                            }
                        });
                        this._diposeBaseObject(index);
                        delete this._baseObjectKeys[index];
                    }
                }
                // Batch deletion can have better performance
                if (needsRemoveBaseObjects.length) {
                    this._layer.removeMesh(needsRemoveBaseObjects, false);
                }
            }
        }
        _diposeBaseObject(index) {
            const baseobjects = this._baseObjectKeys[index];
            if (baseobjects && baseobjects.length) {
                baseobjects.forEach(baseobject => {
                    baseobject.getObject3d().geometry.dispose();
                    if (baseobject._geometryCache) {
                        baseobject._geometryCache.dispose();
                    }
                    const bos = baseobject._baseObjects;
                    if (bos && bos.length) {
                        bos.forEach(bo => {
                            bo.getObject3d().geometry.dispose();
                            bo = null;
                        });
                    }
                    baseobject._datas = null;
                    baseobject._geometriesAttributes = null;
                    baseobject._faceMap = null;
                    baseobject._colorMap = null;
                    if (baseobject.pickObject3d) {
                        baseobject.pickObject3d.geometry.dispose();
                        // baseobject.pickObject3d.material.dispose();
                    }
                    baseobject = null;
                });
            }
        }
        _cachetile(index, baseobject) {
            if (!this._baseObjectKeys[index]) {
                this._baseObjectKeys[index] = [];
            }
            this._baseObjectKeys[index].push(baseobject);
        }
        _getXYZOfIndex(index) {
            const splitstr = index.indexOf('_') > -1 ? '_' : '-';
            let [y, x, z] = index.split(splitstr).slice(1, 4);
            const x1 = parseInt(x);
            const y1 = parseInt(y);
            const z1 = parseInt(z);
            return { x: x1, y: y1, z: z1 };
        }
        _getTileExtent(x, y, z) {
            const map = this.getMap(), res = map._getResolution(z), tileConfig = this._getTileConfig(), tileExtent = tileConfig.getTilePrjExtent(x, y, res);
            return tileExtent;
        }
        /**
         *
         * @param {} x
         * @param {*} y
         * @param {*} z
         */
        _getTileLngLatExtent(x, y, z) {
            const tileExtent = this._getTileExtent(x, y, z);
            let max = tileExtent.getMax(), min = tileExtent.getMin();
            const map = this.getMap();
            const projection = map.getProjection();
            min = projection.unproject(min);
            max = projection.unproject(max);
            return new maptalks.Extent(min, max);
        }
    }

    const OPTIONS$d = {
        worker: false
    };
    /**
     *Provide a simple data loading layer with large amount of data
     */
    class ThreeVectorTileLayer extends BaseVectorTileLayer {
        constructor(url, options = {}, getMaterial, layer) {
            super(maptalks.Util.GUID(), maptalks.Util.extend({ urlTemplate: url }, OPTIONS$d, options));
            this._opts = options;
            this._layer = layer;
            this.getMaterial = getMaterial;
            this._baseObjectKeys = {};
            this._loadTiles = {};
            this._add = null;
            this._layerLaodTime = new Date().getTime();
            this._init();
        }
        /**
         * this is can override
         * @param {*} index
         * @param {*} json
         */
        formatBaseObjects(index, json) {
            const opts = this._opts, baseobjects = [];
            const asynchronous = this.isAsynchronous();
            for (let layerName in json) {
                const geojson = json[layerName] || {};
                let features;
                if (Array.isArray(geojson)) {
                    features = geojson;
                }
                else if (geojson.type === 'FeatureCollection') {
                    features = geojson.features;
                }
                if (features && features.length) {
                    const polygons = [], lineStrings = [], points = [];
                    for (let i = 0, len = features.length; i < len; i++) {
                        const feature = features[i];
                        if (isGeoJSONPolygon(feature)) {
                            polygons.push(feature);
                        }
                        else if (isGeoJSONLine(feature)) {
                            const fs = spliteGeoJSONMulti(feature);
                            for (let j = 0, len1 = fs.length; j < len1; j++) {
                                lineStrings.push(fs[j]);
                            }
                        }
                        else if (isGeoJSONPoint(feature)) {
                            const fs = spliteGeoJSONMulti(feature);
                            for (let j = 0, len1 = fs.length; j < len1; j++) {
                                points.push(maptalks.Util.extend({}, fs[j].properties, fs[j], { coordinate: getGeoJSONCoordinates(fs[j]) }));
                            }
                        }
                    }
                    if (polygons.length) {
                        const material = this._getMaterial(layerName, polygons, index, geojson);
                        if (material) {
                            const extrudepolygons = this._layer.toExtrudePolygons(polygons, maptalks.Util.extend({}, { topColor: '#fff', layerName, asynchronous, key: index }, opts), material);
                            baseobjects.push(extrudepolygons);
                        }
                    }
                    if (lineStrings.length) {
                        const material = this._getMaterial(layerName, lineStrings, index, geojson);
                        if (material && (material instanceof THREE.LineBasicMaterial || material instanceof THREE.LineDashedMaterial)) {
                            const lines = this._layer.toLines(lineStrings, maptalks.Util.extend({}, { layerName }, opts), material);
                            baseobjects.push(lines);
                        }
                    }
                    if (points.length) {
                        const material = this._getMaterial(layerName, points, index, geojson);
                        if (material && material instanceof THREE.PointsMaterial) {
                            const ps = this._layer.toPoints(points, maptalks.Util.extend({}, { layerName }, opts), material);
                            baseobjects.push(ps);
                        }
                    }
                }
            }
            return baseobjects;
        }
        //queue loop
        loopMessage(q) {
            const { currentQueue } = getQueues();
            if (currentQueue.length > 0) {
                this.getTileData(q);
            }
        }
        _init() {
            this.on('layerload', this._layerOnLoad);
            this.on('add', () => {
                if (this._add === false) {
                    const baseobjects = this.getBaseObjects();
                    this._layer.addMesh(baseobjects);
                }
                this._add = true;
                /**
                 * layerload have a bug ,Sometimes it doesn't trigger,I don't know why
                 * Add heartbeat detection mechanism
                 */
                this.intervalId = setInterval(() => {
                    if (this._isLoad() && (!this._layer.getMap().isInteracting())) {
                        this.fire('layerload');
                    }
                }, 1000);
            });
            this.on('remove', () => {
                this._add = false;
                const baseobjects = this.getBaseObjects();
                this._layer.removeMesh(baseobjects);
                clearInterval(this.intervalId);
            });
            this.on('show', () => {
                const baseobjects = this.getBaseObjects();
                baseobjects.forEach(baseobject => {
                    baseobject.show();
                });
                for (let key in this._baseObjectKeys) {
                    const baseobjects = this._baseObjectKeys[key] || [];
                    baseobjects.forEach(baseobject => {
                        baseobject.show();
                    });
                }
            });
            this.on('hide', () => {
                const baseobjects = this.getBaseObjects();
                baseobjects.forEach(baseobject => {
                    baseobject.hide();
                });
                for (let key in this._baseObjectKeys) {
                    const baseobjects = this._baseObjectKeys[key] || [];
                    baseobjects.forEach(baseobject => {
                        baseobject.hide();
                    });
                }
            });
            this.on('renderercreate', (e) => {
                e.renderer.loadTile = function loadTile(tile) {
                    var tileSize = this.layer.getTileSize();
                    var tileImage = new Image();
                    tileImage.width = tileSize['width'];
                    tileImage.height = tileSize['height'];
                    tileImage.onload = this.onTileLoad.bind(this, tileImage, tile);
                    tileImage.onerror = this.onTileError.bind(this, tileImage, tile);
                    this.loadTileImage(tileImage, tile['url'], tile.id);
                    return tileImage;
                };
                e.renderer.deleteTile = function (tile) {
                    if (!tile || !tile.image) {
                        return;
                    }
                    tile.image.onload = null;
                    tile.image.onerror = null;
                    const tileinfo = tile.info || {};
                    outQueue(tileinfo.id);
                };
                e.renderer.loadTileImage = (img, url, key) => {
                    img._key = key;
                    pushQueue(key, url, (index, json, image) => {
                        // img.src = generateImage(key, this._opts.debug);
                        this._generateBaseObjects(index, json, image);
                        nextLoop(index, this);
                    }, img, this);
                };
            });
        }
        _getMaterial(layerName, data, index, geojson) {
            if (this.getMaterial && maptalks.Util.isFunction(this.getMaterial)) {
                return this.getMaterial(layerName, data, index, geojson);
            }
            return null;
        }
    }

    // import { addAttribute } from './util/ThreeAdaptUtil';
    const textureLoader = new THREE.TextureLoader();
    const canvas$1 = document.createElement('canvas'), tileSize = 256;
    function getRGBData(image, width = tileSize, height = tileSize) {
        canvas$1.width = width;
        canvas$1.height = height;
        const ctx = canvas$1.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height).data;
    }
    function generateImage$1(image) {
        if (!image) {
            return null;
        }
        let img;
        if (typeof image === 'string') {
            img = new Image();
            img.src = image;
        }
        else if (image instanceof HTMLCanvasElement) {
            img = new Image();
            img.src = image.toDataURL();
        }
        else if (image instanceof Image) {
            img = new Image();
            img.src = image.src;
            img.crossOrigin = image.crossOrigin;
        }
        if (img && !img.crossOrigin) {
            img.crossOrigin = 'Anonymous';
        }
        return img;
    }
    const OPTIONS$e = {
        interactive: false,
        altitude: 0,
        image: null,
        imageWidth: 256,
        imageHeight: 256,
        texture: null
    };
    /**
     *
     */
    class Terrain extends BaseObject {
        constructor(extent, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$e, options, { layer, extent });
            const { texture, image, altitude, imageHeight, imageWidth } = options;
            if (!image) {
                console.error('not find image');
            }
            if (!(extent instanceof maptalks.Extent)) {
                extent = new maptalks.Extent(extent);
            }
            const { xmin, ymin, xmax, ymax } = extent;
            const coords = [
                [xmin, ymin],
                [xmin, ymax],
                [xmax, ymax],
                [xmax, ymin]
            ];
            let vxmin = Infinity, vymin = Infinity, vxmax = -Infinity, vymax = -Infinity;
            coords.forEach(coord => {
                const v = layer.coordinateToVector3(coord);
                const { x, y } = v;
                vxmin = Math.min(x, vxmin);
                vymin = Math.min(y, vymin);
                vxmax = Math.max(x, vxmax);
                vymax = Math.max(y, vymax);
            });
            const w = Math.abs(vxmax - vxmin), h = Math.abs(vymax - vymin);
            const rgbImg = generateImage$1(image), img = generateImage$1(texture);
            const geometry = new THREE.PlaneBufferGeometry(w, h, imageWidth - 1, imageHeight - 1);
            super();
            this._initOptions(options);
            this._createMesh(geometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(extent.getCenter(), z);
            this.getObject3d().position.copy(v);
            material.transparent = true;
            if (rgbImg) {
                material.opacity = 0;
                rgbImg.onload = () => {
                    const width = imageWidth, height = imageHeight;
                    const imgdata = getRGBData(rgbImg, width, height);
                    let idx = 0;
                    const cache = {};
                    //rgb to height  https://docs.mapbox.com/help/troubleshooting/access-elevation-data/
                    for (let i = 0, len = imgdata.length; i < len; i += 4) {
                        const R = imgdata[i], G = imgdata[i + 1], B = imgdata[i + 2];
                        const height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);
                        const z = distanceToVector3(height, layer, cache);
                        geometry.attributes.position.array[idx * 3 + 2] = z;
                        idx++;
                    }
                    geometry.attributes.position.needsUpdate = true;
                    if (img) {
                        textureLoader.load(img.src, (texture) => {
                            material.map = texture;
                            material.opacity = 1;
                            material.needsUpdate = true;
                        });
                    }
                    else {
                        material.opacity = 1;
                    }
                };
                rgbImg.onerror = function () {
                    console.error(`not load ${rgbImg.src}`);
                };
            }
            this.type = 'Terrain';
        }
    }

    const OPTIONS$f = {
        // worker: false
        scale: 1,
        tileDivisor: 4
    };
    /**
     *
     */
    class TerrainVectorTileLayer extends BaseVectorTileLayer {
        constructor(url, options = {}, material, layer) {
            super(maptalks.Util.GUID(), maptalks.Util.extend({ urlTemplate: url }, OPTIONS$f, options));
            this._opts = options;
            this._layer = layer;
            this.material = material;
            this._baseObjectKeys = {};
            this._loadTiles = {};
            this._add = null;
            this._imgQueue = {};
            this._layerLaodTime = new Date().getTime();
            this._init();
        }
        isAsynchronous() {
            return false;
        }
        /**
         * this is can override
         * @param {*} index
         * @param {*} json
         */
        formatBaseObjects(index, image) {
            const opts = this.options, baseobjects = [];
            const { scale, tileDivisor } = opts;
            const { x, y, z } = this._getXYZOfIndex(index);
            const zoom = this.getMap().getZoom();
            const texture = this.getTileUrl(x, y, z);
            const [imageWidth, imageHeight] = this.options.tileSize;
            const extent = this._getTileLngLatExtent(x, y, z);
            const material = this.material.clone();
            if ((z + 1) >= Math.round(zoom)) {
                const terrain = new Terrain(extent, {
                    image,
                    imageWidth: imageWidth / tileDivisor,
                    imageHeight: imageHeight / tileDivisor,
                    texture
                }, material, this._layer);
                terrain.getObject3d().scale.set(scale, scale, 1);
                baseobjects.push(terrain);
            }
            return baseobjects;
        }
        //queue loop
        loopMessage(q) {
            this.getTileData(q);
        }
        _init() {
            this.on('layerload', this._layerOnLoad);
            this.on('add', () => {
                if (this._add === false) {
                    const baseobjects = this.getBaseObjects();
                    this._layer.addMesh(baseobjects);
                }
                this._add = true;
                /**
                 * layerload have a bug ,Sometimes it doesn't trigger,I don't know why
                 * Add heartbeat detection mechanism
                 */
                this.intervalId = setInterval(() => {
                    if (this._isLoad() && (!this._layer.getMap().isInteracting())) {
                        this.fire('layerload');
                    }
                }, 1000);
            });
            this.on('remove', () => {
                this._add = false;
                const baseobjects = this.getBaseObjects();
                this._layer.removeMesh(baseobjects);
                clearInterval(this.intervalId);
            });
            this.on('show', () => {
                const baseobjects = this.getBaseObjects();
                baseobjects.forEach(baseobject => {
                    baseobject.show();
                });
                for (let key in this._baseObjectKeys) {
                    const baseobjects = this._baseObjectKeys[key] || [];
                    baseobjects.forEach(baseobject => {
                        baseobject.show();
                    });
                }
            });
            this.on('hide', () => {
                const baseobjects = this.getBaseObjects();
                baseobjects.forEach(baseobject => {
                    baseobject.hide();
                });
                for (let key in this._baseObjectKeys) {
                    const baseobjects = this._baseObjectKeys[key] || [];
                    baseobjects.forEach(baseobject => {
                        baseobject.hide();
                    });
                }
            });
            this.on('renderercreate', (e) => {
                e.renderer.loadTile = function loadTile(tile) {
                    var tileSize = this.layer.getTileSize();
                    var tileImage = new Image();
                    tileImage.width = tileSize['width'];
                    tileImage.height = tileSize['height'];
                    tileImage.onload = this.onTileLoad.bind(this, tileImage, tile);
                    tileImage.onerror = this.onTileError.bind(this, tileImage, tile);
                    this.loadTileImage(tileImage, tile['url'], tile.id);
                    return tileImage;
                };
                e.renderer.deleteTile = (tile) => {
                    if (!tile || !tile.image) {
                        return;
                    }
                    tile.image.onload = null;
                    tile.image.onerror = null;
                    const tileinfo = tile.info || {};
                    const rgbImage = this._imgQueue[tileinfo.id];
                    if (rgbImage) {
                        rgbImage.src = '';
                        rgbImage.onload = null;
                        rgbImage.onerror = null;
                        delete this._imgQueue[tileinfo.id];
                    }
                };
                e.renderer.loadTileImage = (img, url, key) => {
                    img._key = key;
                    const rgbImage = new Image();
                    this._imgQueue[key] = rgbImage;
                    const q = {
                        key,
                        url,
                        rgbImage,
                        callback: (index, rgbImage, image) => {
                            this._generateBaseObjects(index, rgbImage, image);
                        },
                        img,
                        vt: this
                    };
                    this.loopMessage(q);
                };
            });
        }
    }

    /*!
     * Code from baidu mapv
     * License: BSD-3
     * https://github.com/huiyan-fe/mapv
     *
     */
    /**
     * Category
     * @param {Object} [options]   Available options:
     *                             {Object} gradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"}
     */
    function Intensity(options) {
        options = options || {};
        this.gradient = options.gradient || {
            0.25: 'rgba(0, 0, 255, 1)',
            0.55: 'rgba(0, 255, 0, 1)',
            0.85: 'rgba(255, 255, 0, 1)',
            1.0: 'rgba(255, 0, 0, 1)'
        };
        this.maxSize = options.maxSize || 35;
        this.minSize = options.minSize || 0;
        this.max = options.max || 100;
        this.min = options.min || 0;
        this.initPalette();
    }
    Intensity.prototype.setMax = function (value) {
        this.max = value || 100;
    };
    Intensity.prototype.setMin = function (value) {
        this.min = value || 0;
    };
    Intensity.prototype.setMaxSize = function (maxSize) {
        this.maxSize = maxSize || 35;
    };
    Intensity.prototype.setMinSize = function (minSize) {
        this.minSize = minSize || 0;
    };
    Intensity.prototype.initPalette = function () {
        var gradient = this.gradient;
        var canvas = createCanvas(256, 1);
        var paletteCtx = this.paletteCtx = canvas.getContext('2d');
        var lineGradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
        for (var key in gradient) {
            lineGradient.addColorStop(parseFloat(key), gradient[key]);
        }
        paletteCtx.fillStyle = lineGradient;
        paletteCtx.fillRect(0, 0, 256, 1);
    };
    Intensity.prototype.getColor = function (value) {
        var imageData = this.getImageData(value);
        return 'rgba(' + imageData[0] + ', ' + imageData[1] + ', ' + imageData[2] + ', ' + imageData[3] / 256 + ')';
    };
    Intensity.prototype.getImageData = function (value) {
        var imageData = this.paletteCtx.getImageData(0, 0, 256, 1).data;
        if (value === undefined) {
            return imageData;
        }
        var max = this.max;
        var min = this.min;
        if (value > max) {
            value = max;
        }
        if (value < min) {
            value = min;
        }
        var index = Math.floor((value - min) / (max - min) * (256 - 1)) * 4;
        return [imageData[index], imageData[index + 1], imageData[index + 2], imageData[index + 3]];
    };
    /**
     * @param Number value
     * @param Number max of value
     * @param Number max of size
     * @param Object other options
     */
    Intensity.prototype.getSize = function (value) {
        var size = 0;
        var max = this.max;
        var min = this.min;
        var maxSize = this.maxSize;
        var minSize = this.minSize;
        if (value > max) {
            value = max;
        }
        if (value < min) {
            value = min;
        }
        if (max > min) {
            size = minSize + (value - min) / (max - min) * (maxSize - minSize);
        }
        else {
            return maxSize;
        }
        return size;
    };
    Intensity.prototype.getLegend = function (options) {
        var gradient = this.gradient;
        var width = options.width || 20;
        var height = options.height || 180;
        var canvas = createCanvas(width, height);
        var paletteCtx = canvas.getContext('2d');
        var lineGradient = paletteCtx.createLinearGradient(0, height, 0, 0);
        for (var key in gradient) {
            lineGradient.addColorStop(parseFloat(key), gradient[key]);
        }
        paletteCtx.fillStyle = lineGradient;
        paletteCtx.fillRect(0, 0, width, height);
        return canvas;
    };

    /*!
     * Code from baidu mapv
     * License: BSD-3
     * https://github.com/huiyan-fe/mapv
     *
     */
    function createCircle(size) {
        var shadowBlur = size / 2;
        var r2 = size + shadowBlur;
        var offsetDistance = 10000;
        var circle = createCanvas(r2 * 2, r2 * 2);
        var context = circle.getContext('2d');
        context.shadowBlur = shadowBlur;
        context.shadowColor = 'black';
        context.shadowOffsetX = context.shadowOffsetY = offsetDistance;
        context.beginPath();
        context.arc(r2 - offsetDistance, r2 - offsetDistance, size, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
        return circle;
    }
    function colorize(pixels, gradient, options) {
        var max = getMax(options);
        var min = getMin(options);
        var diff = max - min;
        var range = options.range || null;
        var jMin = 0;
        var jMax = 1024;
        if (range && range.length === 2) {
            jMin = (range[0] - min) / diff * 1024;
        }
        if (range && range.length === 2) {
            jMax = (range[1] - min) / diff * 1024;
        }
        var maxOpacity = options.maxOpacity || 0.8;
        var minOpacity = options.minOpacity || 0;
        // var range = options.range;
        for (var i = 3, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i] * 4; // get gradient color from opacity value
            if (pixels[i] / 256 > maxOpacity) {
                pixels[i] = 256 * maxOpacity;
            }
            if (pixels[i] / 256 < minOpacity) {
                pixels[i] = 256 * minOpacity;
            }
            if (j && j >= jMin && j <= jMax) {
                pixels[i - 3] = gradient[j];
                pixels[i - 2] = gradient[j + 1];
                pixels[i - 1] = gradient[j + 2];
            }
            else {
                pixels[i] = 0;
            }
        }
    }
    function getMax(options) {
        var max = options.max || 100;
        return max;
    }
    function getMin(options) {
        var min = options.min || 0;
        return min;
    }
    function drawGray(context, dataSet, options) {
        var max = getMax(options);
        // var min = getMin(options);
        // console.log(max)
        var size = options._size || options.size || 13;
        var circle = createCircle(size);
        var circleHalfWidth = circle.width / 2;
        var circleHalfHeight = circle.height / 2;
        var data = dataSet;
        var dataOrderByAlpha = {};
        data.forEach(function (item) {
            var count = item.count === undefined ? 1 : item.count;
            var alpha = Math.min(1, count / max).toFixed(2);
            dataOrderByAlpha[alpha] = dataOrderByAlpha[alpha] || [];
            dataOrderByAlpha[alpha].push(item);
        });
        for (var i in dataOrderByAlpha) {
            if (isNaN(i))
                continue;
            var _data = dataOrderByAlpha[i];
            context.beginPath();
            if (!options.withoutAlpha) {
                context.globalAlpha = i;
            }
            // context.strokeStyle = intensity.getColor(i * max);
            _data.forEach(function (item) {
                var coordinates = item.coordinate;
                var count = item.count === undefined ? 1 : item.count;
                context.globalAlpha = count / max;
                context.drawImage(circle, coordinates[0] - circleHalfWidth, coordinates[1] - circleHalfHeight);
            });
        }
    }
    function draw(context, data, options) {
        if (context.canvas.width <= 0 || context.canvas.height <= 0) {
            return;
        }
        var strength = options.strength || 0.3;
        context.strokeStyle = 'rgba(0,0,0,' + strength + ')';
        // var shadowCanvas = new Canvas(context.canvas.width, context.canvas.height);
        var shadowCanvas = createCanvas(context.canvas.width, context.canvas.height);
        var shadowContext = shadowCanvas.getContext('2d');
        shadowContext.scale(devicePixelRatio, devicePixelRatio);
        options = options || {};
        // var data = dataSet instanceof DataSet ? dataSet.get() : dataSet;
        context.save();
        var intensity = new Intensity({
            gradient: options.gradient
        });
        drawGray(shadowContext, data, options);
        // return false;
        if (!options.absolute) {
            var colored = shadowContext.getImageData(0, 0, context.canvas.width, context.canvas.height);
            colorize(colored.data, intensity.getImageData(), options);
            context.putImageData(colored, 0, 0);
            context.restore();
        }
        intensity = null;
        shadowCanvas = null;
    }
    var HeatMapUitl = {
        draw,
        drawGray,
        colorize
    };

    const OPTIONS$g = {
        altitude: 0,
        interactive: false,
        min: 0,
        max: 100,
        size: 13,
        gradient: { 0.25: 'rgb(0,0,255)', 0.55: 'rgb(0,255,0)', 0.85: 'yellow', 1.0: 'rgb(255,0,0)' },
        gridScale: 0.5
    };
    const CANVAS_MAX_SIZE = 2048;
    /**
     *
     */
    class HeatMap extends BaseObject {
        constructor(data, options, material, layer) {
            if (!Array.isArray(data)) {
                data = [data];
            }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const vs = [];
            //Calculate bbox
            for (let i = 0, len = data.length; i < len; i++) {
                const { coordinate, lnglat, xy } = data[i];
                const coord = coordinate || lnglat || xy;
                if (!coord) {
                    console.warn('not find coordinate');
                    continue;
                }
                const v = layer.coordinateToVector3(coord);
                vs.push(v);
                const { x, y } = v;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            options = maptalks.Util.extend({}, OPTIONS$g, options, { layer, points: data });
            // Calculate canvas width and height
            let { gridScale, altitude } = options;
            const offsetX = Math.abs(maxX - minX), offsetY = Math.abs(maxY - minY);
            const maxOffset = Math.max((offsetX * gridScale), (offsetY * gridScale));
            if (maxOffset > CANVAS_MAX_SIZE) {
                console.warn(`gridScale: ${gridScale} it's too big. I hope it's a smaller value,canvas max size is ${CANVAS_MAX_SIZE}* ${CANVAS_MAX_SIZE}`);
                const offset = maxOffset / gridScale;
                gridScale = CANVAS_MAX_SIZE / offset;
            }
            const canvasWidth = Math.ceil(offsetX * gridScale), canvasHeight = Math.ceil(offsetY * gridScale);
            const scaleX = canvasWidth / offsetX, scaleY = canvasHeight / offsetY;
            const pixels = [];
            for (let i = 0, len = vs.length; i < len; i++) {
                const v = vs[i];
                v.x -= minX;
                v.y -= minY;
                v.x *= scaleX;
                v.y *= scaleY;
                v.y = canvasHeight - v.y;
                //for heat draw data
                pixels.push({
                    coordinate: [v.x, v.y],
                    count: data[i].count
                });
            }
            let shadowCanvas = createCanvas(canvasWidth, canvasHeight);
            let shadowContext = shadowCanvas.getContext('2d');
            // shadowContext.scale(devicePixelRatio, devicePixelRatio);
            HeatMapUitl.drawGray(shadowContext, pixels, options);
            const colored = shadowContext.getImageData(0, 0, shadowContext.canvas.width, shadowContext.canvas.height);
            let maxAlpha = -Infinity;
            const blackps = {}, alphas = [];
            for (let i = 3, len = colored.data.length, j = 0; i < len; i += 4) {
                const alpha = colored.data[i];
                maxAlpha = Math.max(maxAlpha, alpha);
                alphas.push(alpha);
                //Points that do not need to be drawn
                if (alpha <= 0) {
                    blackps[j] = 1;
                }
                j++;
            }
            const intensity = new Intensity({
                gradient: options.gradient
            });
            HeatMapUitl.colorize(colored.data, intensity.getImageData(), options);
            shadowCanvas = null;
            shadowContext = null;
            const geometry = new THREE.PlaneBufferGeometry(offsetX, offsetY, canvasWidth - 1, canvasHeight - 1);
            const index = geometry.getIndex().array;
            const position = geometry.attributes.position.array;
            // Index of the points that really need to be drawn
            const filterIndex = [];
            const colors = [];
            const color = new THREE.Color();
            for (let i = 0, len = position.length, j = 0, len1 = index.length, m = 0, len2 = colored.data.length, n = 0; i < Math.max(len, len1, len2); i += 3) {
                if (i < len) {
                    const alpha = alphas[n];
                    if (alpha > 0) {
                        position[i + 2] = alpha / maxAlpha;
                    }
                }
                if (j < len1) {
                    const a = index[j], b = index[j + 1], c = index[j + 2];
                    if ((!blackps[a]) || (!blackps[b]) || (!blackps[c])) {
                        filterIndex.push(a, b, c);
                    }
                }
                if (m < len2) {
                    const r = colored.data[m], g = colored.data[m + 1], b = colored.data[m + 2]; // a = colored.data[i + 3];
                    const rgb = `rgb(${r},${g},${b})`;
                    color.setStyle(rgb);
                    colors.push(color.r, color.g, color.b);
                }
                j += 3;
                m += 4;
                n++;
            }
            geometry.setIndex(new THREE.Uint32BufferAttribute(filterIndex, 1));
            addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
            material.vertexColors = getVertexColors();
            super();
            this._initOptions(options);
            this._createMesh(geometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            this.getObject3d().position.copy(new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, z));
            this.type = 'HeatMap';
        }
    }

    const color = new THREE.Color();
    let colorIndex = 1;
    /**
     *https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_cubes_gpu.html
     */
    class GPUPick {
        constructor(layer) {
            this.object3ds = [];
            this.layer = layer;
            this.camera = layer.getCamera();
            this.renderer = layer.getThreeRenderer();
            this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
            this.pickingScene = new THREE.Scene();
        }
        getColor() {
            color.setHex(colorIndex);
            colorIndex++;
            return color;
        }
        add(object3d) {
            if (object3d) {
                const colorIndex = object3d['_colorIndex'];
                if (colorIndex) {
                    this.object3ds[colorIndex] = object3d;
                    this.pickingScene.add(object3d);
                }
            }
            return this;
        }
        remove(object3d) {
            if (object3d) {
                const colorIndex = object3d['_colorIndex'];
                if (colorIndex) {
                    this.object3ds[colorIndex] = null;
                    this.pickingScene.remove(object3d);
                }
            }
            return this;
        }
        isEmpty() {
            if (this.pickingScene.children.length === 0) {
                return true;
            }
            for (let i = 0, len = this.pickingScene.children.length; i < len; i++) {
                const mesh = this.pickingScene.children[i];
                if (mesh) {
                    const object3d = mesh['__parent'];
                    if (object3d && object3d.getOptions().interactive === true) {
                        return false;
                    }
                }
            }
            return true;
        }
        pick(pixel) {
            if (!pixel) {
                return;
            }
            if (this.isEmpty()) {
                return;
            }
            const { camera, renderer, pickingTexture, pickingScene, object3ds, layer } = this;
            const len = this.pickingScene.children.length;
            // reset all object3d picked
            for (let i = 0; i < len; i++) {
                const object3d = this.pickingScene.children[i];
                if (object3d && object3d['__parent']) {
                    object3d['__parent'].picked = false;
                }
            }
            //resize size
            const { width, height } = layer._getRenderer().canvas;
            const pw = pickingTexture.width, ph = pickingTexture.height;
            if (width !== pw || height !== ph) {
                pickingTexture.setSize(width, height);
            }
            //render the picking scene off-screen
            // set the view offset to represent just a single pixel under the mouse
            // camera.setViewOffset(width, height, mouse.x, mouse.y, 1, 1);
            // render the scene
            renderer.setRenderTarget(pickingTexture);
            renderer.clear();
            renderer.render(pickingScene, camera);
            // clear the view offset so rendering returns to normal
            // camera.clearViewOffset();
            //create buffer for reading single pixel
            const pixelBuffer = new Uint8Array(4);
            //read the pixel
            const { x, y } = pixel;
            const devicePixelRatio = window.devicePixelRatio;
            const offsetX = (x * devicePixelRatio), offsetY = (pickingTexture.height - y * devicePixelRatio);
            renderer.readRenderTargetPixels(pickingTexture, Math.round(offsetX), Math.round(offsetY), 1, 1, pixelBuffer);
            //interpret the pixel as an ID
            const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
            const object3d = object3ds[id];
            if (object3d) {
                if (object3d['__parent']) {
                    object3ds[id]['__parent'].picked = true;
                }
            }
            else {
                //for merged mesh
                for (let i = 0; i < len; i++) {
                    const object3d = this.pickingScene.children[i];
                    if (object3d && object3d['__parent']) {
                        const parent = object3d['__parent'];
                        if (parent._colorMap && parent._colorMap[id] != null) {
                            parent.picked = true;
                            parent.index = parent._colorMap[id];
                            break;
                        }
                    }
                }
            }
            renderer.setRenderTarget(null);
        }
    }

    const OPTIONS$h = {
        bottomHeight: 0,
        altitude: 0
    };
    class FatLine extends BaseObject {
        constructor(lineString, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$h, options, { layer, lineString });
            super();
            this._initOptions(options);
            const { lineStrings, center } = LineStringSplit(lineString);
            const ps = [], cache = {};
            for (let m = 0, le = lineStrings.length; m < le; m++) {
                const positionsV = getLinePosition(lineStrings[m], layer, center).positionsV;
                setBottomHeight(positionsV, options.bottomHeight, layer, cache);
                for (let i = 0, len = positionsV.length; i < len; i++) {
                    const v = positionsV[i];
                    if (i > 0 && i < len - 1) {
                        ps.push(v.x, v.y, v.z);
                    }
                    ps.push(v.x, v.y, v.z);
                }
            }
            const geometry = new LineGeometry();
            geometry.setPositions(ps);
            this._setMaterialRes(layer, material);
            this._createLine2(geometry, material);
            const { altitude } = options;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this._setPickObject3d(ps, material.linewidth);
            this._init();
            this.type = 'FatLine';
        }
        _init() {
            const pick = this.getLayer().getPick();
            this.on('add', () => {
                pick.add(this.pickObject3d);
            });
            this.on('remove', () => {
                pick.remove(this.pickObject3d);
            });
        }
        _setMaterialRes(layer, material) {
            const map = layer.getMap();
            const size = map.getSize();
            const width = size.width, height = size.height;
            material.resolution.set(width, height);
        }
        _setPickObject3d(ps, linewidth) {
            const geometry = new LineGeometry();
            geometry.setPositions(ps);
            const pick = this.getLayer().getPick();
            const color = pick.getColor();
            const colors = [];
            for (let i = 0, len = ps.length / 3; i < len; i++) {
                colors.push(color.r, color.g, color.b);
            }
            geometry.setColors(colors);
            const material = new LineMaterial({
                color: '#fff',
                // side: THREE.BackSide,
                linewidth,
                vertexColors: getVertexColors()
            });
            this._setMaterialRes(this.getLayer(), material);
            const colorIndex = color.getHex();
            const mesh = new Line2(geometry, material);
            mesh.position.copy(this.getObject3d().position);
            mesh._colorIndex = colorIndex;
            this.setPickObject3d(mesh);
        }
        // eslint-disable-next-line no-unused-vars
        identify(coordinate) {
            return this.picked;
        }
        setSymbol(material) {
            if (material && material instanceof THREE.Material) {
                material.needsUpdate = true;
                const size = this.getMap().getSize();
                const width = size.width, height = size.height;
                material.resolution.set(width, height);
                this.getObject3d().material = material;
            }
            return this;
        }
    }

    const OPTIONS$i = {
        altitude: 0,
        colors: null
    };
    /**
     *
     */
    class FatLines extends MergedMixin(BaseObject) {
        constructor(lineStrings, options, material, layer) {
            if (!Array.isArray(lineStrings)) {
                lineStrings = [lineStrings];
            }
            const centers = [], lineStringList = [];
            const len = lineStrings.length;
            for (let i = 0; i < len; i++) {
                const lineString = lineStrings[i];
                const result = LineStringSplit(lineString);
                centers.push(result.center);
                lineStringList.push(result.lineStrings);
            }
            // Get the center point of the point set
            const center = getCenterOfPoints(centers);
            options = maptalks.Util.extend({}, OPTIONS$i, options, { layer, lineStrings, coordinate: center });
            const lines = [], cache = {};
            let faceIndex = 0, faceMap = [], geometriesAttributes = [], psIndex = 0, ps = [];
            //LineSegmentsGeometry
            for (let i = 0; i < len; i++) {
                const lls = lineStringList[i];
                let psCount = 0;
                for (let m = 0, le = lls.length; m < le; m++) {
                    const properties = (isGeoJSONLine(lls[m]) ? lls[m]['properties'] : lls[m].getProperties() || {});
                    const { positionsV } = getLinePosition(lls[m], layer, center);
                    setBottomHeight(positionsV, properties.bottomHeight, layer, cache);
                    psCount += (positionsV.length * 2 - 2);
                    for (let j = 0, len1 = positionsV.length; j < len1; j++) {
                        const v = positionsV[j];
                        if (j > 0 && j < len1 - 1) {
                            ps.push(v.x, v.y, v.z);
                        }
                        ps.push(v.x, v.y, v.z);
                    }
                }
                // const psCount = positionsV.length + positionsV.length - 2;
                const faceLen = psCount;
                faceMap[i] = [faceIndex, faceIndex + faceLen];
                faceIndex += faceLen;
                geometriesAttributes[i] = {
                    position: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    instanceStart: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    instanceEnd: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    hide: false
                };
                psIndex += psCount * 3;
            }
            super();
            this._initOptions(options);
            const geometry = new LineGeometry();
            geometry.setPositions(ps);
            this._setMaterialRes(layer, material);
            this._createLine2(geometry, material);
            const { altitude } = options;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = layer.coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this._faceMap = faceMap;
            this._baseObjects = lines;
            this._datas = lineStrings;
            this._geometriesAttributes = geometriesAttributes;
            this.faceIndex = null;
            this.index = null;
            this._geometryCache = new LineGeometry();
            this._geometryCache.setPositions(ps);
            this._colorMap = {};
            this.isHide = false;
            this._initBaseObjectsEvent(lines);
            this._setPickObject3d(ps, material.linewidth);
            this._init();
            this.type = 'FatLines';
        }
        _setMaterialRes(layer, material) {
            const map = layer.getMap();
            const size = map.getSize();
            const width = size.width, height = size.height;
            material.resolution.set(width, height);
        }
        _setPickObject3d(ps, linewidth) {
            const geometry = this._geometryCache || new LineGeometry();
            geometry.setPositions(ps);
            const pick = this.getLayer().getPick();
            const { _geometriesAttributes } = this;
            const colors = [];
            for (let i = 0, len = _geometriesAttributes.length; i < len; i++) {
                const color = pick.getColor();
                const colorIndex = color.getHex();
                this._colorMap[colorIndex] = i;
                const { count } = _geometriesAttributes[i].position;
                this._datas[i].colorIndex = colorIndex;
                for (let j = 0; j < count; j++) {
                    colors.push(color.r, color.g, color.b);
                }
            }
            geometry.setColors(colors);
            const material = new LineMaterial({
                // color: color.getStyle(),
                // side: THREE.BackSide,
                color: '#fff',
                linewidth,
                vertexColors: getVertexColors()
                // dashed: false
            });
            this._setMaterialRes(this.getLayer(), material);
            const color = pick.getColor();
            const colorIndex = color.getHex();
            const mesh = new Line2(geometry, material);
            mesh.position.copy(this.getObject3d().position);
            mesh._colorIndex = colorIndex;
            this.setPickObject3d(mesh);
        }
        // eslint-disable-next-line no-unused-vars
        identify(coordinate) {
            return this.picked;
        }
        setSymbol(material) {
            if (material && material instanceof THREE.Material) {
                material.needsUpdate = true;
                const size = this.getMap().getSize();
                const width = size.width, height = size.height;
                material.resolution.set(width, height);
                this.getObject3d().material = material;
            }
            return this;
        }
        // eslint-disable-next-line consistent-return
        getSelectMesh() {
            const index = this._getIndex();
            if (index != null) {
                if (!this._baseObjects[index]) {
                    const lineString = this._datas[index];
                    const opts = maptalks.Util.extend({}, this.getOptions(), { index }, isGeoJSONLine(lineString) ? lineString.properties : lineString.getProperties());
                    this._baseObjects[index] = new FatLine(lineString, opts, this.getObject3d().material, this.getLayer());
                    this._proxyEvent(this._baseObjects[index]);
                }
                return {
                    data: this._datas[index],
                    baseObject: this._baseObjects[index]
                };
            }
        }
        /**
           * update geometry attributes
           * @param {*} bufferAttribute
           * @param {*} attribute
           */
        _updateAttribute(bufferAttribute, attribute) {
            const { indexs } = this._getHideGeometryIndex(attribute);
            const array = this._geometryCache.attributes[attribute].array;
            const len = array.length;
            for (let i = 0; i < len; i++) {
                bufferAttribute.array[i] = array[i];
            }
            let value = -100000;
            for (let j = 0; j < indexs.length; j++) {
                const index = indexs[j];
                const { start, end } = this._geometriesAttributes[index][attribute];
                for (let i = start; i < end; i++) {
                    bufferAttribute.array[i] = value;
                }
            }
            return this;
        }
        _showGeometry(baseObject, isHide) {
            let index;
            if (baseObject) {
                index = baseObject.getOptions().index;
            }
            if (index != null) {
                const geometryAttributes = this._geometriesAttributes[index];
                const { hide } = geometryAttributes;
                if (hide === isHide) {
                    return this;
                }
                geometryAttributes.hide = isHide;
                const buffGeom = this.getObject3d().geometry;
                this._updateAttribute(buffGeom.attributes.instanceStart, 'instanceStart');
                this._updateAttribute(buffGeom.attributes.instanceEnd, 'instanceEnd');
                // this._updateAttribute(buffGeom.attributes.instanceDistanceStart, 'instanceDistanceStart');
                // this._updateAttribute(buffGeom.attributes.instanceDistanceEnd, 'instanceDistanceEnd');
                buffGeom.attributes.instanceStart.data.needsUpdate = true;
                buffGeom.attributes.instanceEnd.data.needsUpdate = true;
                // buffGeom.attributes.instanceDistanceStart.data.needsUpdate = true;
                // buffGeom.attributes.instanceDistanceEnd.data.needsUpdate = true;
                this.isHide = isHide;
            }
            return this;
        }
    }

    const OPTIONS$j = {
        radius: 10,
        height: 100,
        altitude: 0,
        topColor: '',
        bottomColor: '#2d2f61',
    };
    class Box extends BaseObject {
        constructor(coordinate, options, material, layer) {
            options = maptalks.Util.extend({}, OPTIONS$j, options, { layer, coordinate });
            super();
            this._initOptions(options);
            const { height, radius, topColor, bottomColor, altitude } = options;
            const h = layer.distanceToVector3(height, height).x;
            const r = layer.distanceToVector3(radius, radius).x;
            const geometry = getDefaultBoxGeometry().clone();
            geometry.scale(r * 2, r * 2, h);
            if (topColor) {
                initVertexColors(geometry, bottomColor, topColor, 'z', h / 2);
                material.vertexColors = getVertexColors();
            }
            this._createMesh(geometry, material);
            const z = layer.distanceToVector3(altitude, altitude).x;
            const position = layer.coordinateToVector3(coordinate, z);
            this.getObject3d().position.copy(position);
            this.type = 'Box';
        }
    }

    const OPTIONS$k = {
        radius: 10,
        height: 100,
        altitude: 0,
        topColor: null,
        bottomColor: '#2d2f61',
    };
    class Boxs extends MergedMixin(BaseObject) {
        constructor(points, options, material, layer) {
            if (!Array.isArray(points)) {
                points = [points];
            }
            const len = points.length;
            const center = getCenterOfPoints(points);
            const centerPt = layer.coordinateToVector3(center);
            const geometries = [], bars = [], geometriesAttributes = [], faceMap = [];
            let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
            const cache = {};
            for (let i = 0; i < len; i++) {
                const opts = maptalks.Util.extend({ index: i }, OPTIONS$k, points[i]);
                const { radius, altitude, topColor, bottomColor, height, coordinate } = opts;
                const r = distanceToVector3(radius, layer, cache);
                const h = distanceToVector3(height, layer, cache);
                const alt = distanceToVector3(altitude, layer, cache);
                const buffGeom = getDefaultBoxGeometry().clone();
                buffGeom.scale(r * 2, r * 2, h);
                if (topColor) {
                    initVertexColors(buffGeom, bottomColor, topColor, 'z', h / 2);
                    material.vertexColors = getVertexColors();
                }
                const v = layer.coordinateToVector3(coordinate).sub(centerPt);
                const parray = buffGeom.attributes.position.array;
                for (let j = 0, len1 = parray.length; j < len1; j += 3) {
                    parray[j + 2] += alt;
                    parray[j] += v.x;
                    parray[j + 1] += v.y;
                    parray[j + 2] += v.z;
                }
                geometries.push(buffGeom);
                const bar = new Box(coordinate, opts, material, layer);
                bars.push(bar);
                const faceLen = buffGeom.index.count / 3;
                faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                faceIndex += faceLen;
                const psCount = buffGeom.attributes.position.count, 
                //  colorCount = buffGeom.attributes.color.count,
                normalCount = buffGeom.attributes.normal.count, uvCount = buffGeom.attributes.uv.count;
                geometriesAttributes[i] = {
                    position: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    normal: {
                        count: normalCount,
                        start: normalIndex,
                        end: normalIndex + normalCount * 3,
                    },
                    // color: {
                    //     count: colorCount,
                    //     start: colorIndex,
                    //     end: colorIndex + colorCount * 3,
                    // },
                    uv: {
                        count: uvCount,
                        start: uvIndex,
                        end: uvIndex + uvCount * 2,
                    },
                    hide: false
                };
                psIndex += psCount * 3;
                normalIndex += normalCount * 3;
                // colorIndex += colorCount * 3;
                uvIndex += uvCount * 2;
            }
            super();
            options = maptalks.Util.extend({}, { altitude: 0, layer, points }, options);
            this._initOptions(options);
            const geometry = mergeBarGeometry(geometries);
            this._createMesh(geometry, material);
            const altitude = options.altitude;
            const z = layer.distanceToVector3(altitude, altitude).x;
            const v = centerPt.clone();
            v.z = z;
            this.getObject3d().position.copy(v);
            this._faceMap = faceMap;
            this._baseObjects = bars;
            this._datas = points;
            this._geometriesAttributes = geometriesAttributes;
            this.faceIndex = null;
            this._geometryCache = geometry.clone();
            this.isHide = false;
            this._colorMap = {};
            this._initBaseObjectsEvent(bars);
            this._setPickObject3d();
            this._init();
            this.type = 'Boxs';
        }
        // eslint-disable-next-line no-unused-vars
        identify(coordinate) {
            return this.picked;
        }
    }

    // eslint-disable-next-line quotes
    const workerCode = `function(e){"use strict";var d=n,t=n;function n(e,t,n){n=n||2;var r,i,o,a,v,h=t&&t.length,l=h?t[0]*n:e.length,u=p(e,0,l,n,!0),x=[];if(!u||u.next===u.prev)return x;if(h&&(u=function(e,t,n,r){var i,o,a,v,h=[];for(i=0,o=t.length;i<o;i++)a=t[i]*r,v=i<o-1?t[i+1]*r:e.length,(v=p(e,a,v,r,!1))===v.next&&(v.steiner=!0),h.push(function(e){var t=e,n=e;for(;(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next,t!==e;);return n}(v));for(h.sort(m),i=0;i<h.length;i++)!function(e,t){(t=function(e,t){var n,r=t,i=e.x,o=e.y,a=-1/0;do{if(o<=r.y&&o>=r.next.y&&r.next.y!==r.y){var v=r.x+(o-r.y)*(r.next.x-r.x)/(r.next.y-r.y);if(v<=i&&a<v){if((a=v)===i){if(o===r.y)return r;if(o===r.next.y)return r.next}n=r.x<r.next.x?r:r.next}}}while(r=r.next,r!==t);if(!n)return null;if(i===a)return n;var h,l=n,u=n.x,x=n.y,f=1/0;r=n;for(;i>=r.x&&r.x>=u&&i!==r.x&&M(o<x?i:a,o,u,x,o<x?a:i,o,r.x,r.y)&&(h=Math.abs(o-r.y)/(i-r.x),Z(r,e)&&(h<f||h===f&&(r.x>n.x||r.x===n.x&&function(e,t){return w(e.prev,e,t.prev)<0&&w(t.next,e,e.next)<0}(n,r)))&&(n=r,f=h)),r=r.next,r!==l;);return n}(e,t))&&(e=S(t,e),g(t,t.next),g(e,e.next))}(h[i],n),n=g(n,n.next);return n}(e,t,u,n)),e.length>80*n){for(var f=r=e[0],s=i=e[1],c=n;c<l;c+=n)(o=e[c])<f&&(f=o),(a=e[c+1])<s&&(s=a),r<o&&(r=o),i<a&&(i=a);v=0!==(v=Math.max(r-f,i-s))?1/v:0}return y(u,x,n,f,s,v),x}function p(e,t,n,r,i){var o,a;if(i===0<z(e,t,n,r))for(o=t;o<n;o+=r)a=v(o,e[o],e[o+1],a);else for(o=n-r;t<=o;o-=r)a=v(o,e[o],e[o+1],a);return a&&u(a,a.next)&&(f(a),a=a.next),a}function g(e,t){if(!e)return e;t=t||e;var n,r=e;do{if(n=!1,r.steiner||!u(r,r.next)&&0!==w(r.prev,r,r.next))r=r.next;else{if(f(r),(r=t=r.prev)===r.next)break;n=!0}}while(n||r!==t);return t}function y(e,t,n,r,i,o,a){if(e){!a&&o&&function(e,t,n,r){for(var i=e;null===i.z&&(i.z=b(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next,i!==e;);i.prevZ.nextZ=null,i.prevZ=null,function(e){var t,n,r,i,o,a,v,h,l=1;do{for(n=e,o=e=null,a=0;n;){for(a++,r=n,t=v=0;t<l&&(v++,r=r.nextZ);t++);for(h=l;0<v||0<h&&r;)0!==v&&(0===h||!r||n.z<=r.z)?(n=(i=n).nextZ,v--):(r=(i=r).nextZ,h--),o?o.nextZ=i:e=i,i.prevZ=o,o=i;n=r}}while(o.nextZ=null,l*=2,1<a)}(i)}(e,r,i,o);for(var v,h,l=e;e.prev!==e.next;)if(v=e.prev,h=e.next,o?function(e,t,n,r){var i=e.prev,o=e,a=e.next;if(0<=w(i,o,a))return!1;var v=(i.x<o.x?i.x<a.x?i:a:o.x<a.x?o:a).x,h=(i.y<o.y?i.y<a.y?i:a:o.y<a.y?o:a).y,l=(i.x>o.x?i.x>a.x?i:a:o.x>a.x?o:a).x,u=(i.y>o.y?i.y>a.y?i:a:o.y>a.y?o:a).y,x=b(v,h,t,n,r),f=b(l,u,t,n,r),s=e.prevZ,c=e.nextZ;for(;s&&s.z>=x&&c&&c.z<=f;){if(s!==e.prev&&s!==e.next&&M(i.x,i.y,o.x,o.y,a.x,a.y,s.x,s.y)&&0<=w(s.prev,s,s.next))return!1;if(s=s.prevZ,c!==e.prev&&c!==e.next&&M(i.x,i.y,o.x,o.y,a.x,a.y,c.x,c.y)&&0<=w(c.prev,c,c.next))return!1;c=c.nextZ}for(;s&&s.z>=x;){if(s!==e.prev&&s!==e.next&&M(i.x,i.y,o.x,o.y,a.x,a.y,s.x,s.y)&&0<=w(s.prev,s,s.next))return!1;s=s.prevZ}for(;c&&c.z<=f;){if(c!==e.prev&&c!==e.next&&M(i.x,i.y,o.x,o.y,a.x,a.y,c.x,c.y)&&0<=w(c.prev,c,c.next))return!1;c=c.nextZ}return!0}(e,r,i,o):function(e){var t=e.prev,n=e,r=e.next;if(0<=w(t,n,r))return!1;var i=e.next.next;for(;i!==e.prev;){if(M(t.x,t.y,n.x,n.y,r.x,r.y,i.x,i.y)&&0<=w(i.prev,i,i.next))return!1;i=i.next}return!0}(e))t.push(v.i/n),t.push(e.i/n),t.push(h.i/n),f(e),e=h.next,l=h.next;else if((e=h)===l){a?1===a?y(e=function(e,t,n){var r=e;do{var i=r.prev,o=r.next.next}while(!u(i,o)&&x(i,r,r.next,o)&&Z(i,o)&&Z(o,i)&&(t.push(i.i/n),t.push(r.i/n),t.push(o.i/n),f(r),f(r.next),r=e=o),r=r.next,r!==e);return g(r)}(g(e),t,n),t,n,r,i,o,2):2===a&&function(e,t,n,r,i,o){var a=e;do{for(var v=a.next.next;v!==a.prev;){if(a.i!==v.i&&function(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!function(e,t){var n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&x(n,n.next,e,t))return!0}while(n=n.next,n!==e);return!1}(e,t)&&(Z(e,t)&&Z(t,e)&&function(e,t){var n=e,r=!1,i=(e.x+t.x)/2,o=(e.y+t.y)/2;for(;n.y>o!=n.next.y>o&&n.next.y!==n.y&&i<(n.next.x-n.x)*(o-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next,n!==e;);return r}(e,t)&&(w(e.prev,e,t.prev)||w(e,t.prev,t))||u(e,t)&&0<w(e.prev,e,e.next)&&0<w(t.prev,t,t.next))}(a,v)){var h=S(a,v);return a=g(a,a.next),h=g(h,h.next),y(a,t,n,r,i,o),y(h,t,n,r,i,o)}v=v.next}}while((a=a.next)!==e)}(e,t,n,r,i,o):y(g(e),t,n,r,i,o,1);break}}}function m(e,t){return e.x-t.x}function b(e,t,n,r,i){return(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=32767*(e-n)*i)|e<<8))|e<<4))|e<<2))|e<<1))|(t=1431655765&((t=858993459&((t=252645135&((t=16711935&((t=32767*(t-r)*i)|t<<8))|t<<4))|t<<2))|t<<1))<<1}function M(e,t,n,r,i,o,a,v){return 0<=(i-a)*(t-v)-(e-a)*(o-v)&&0<=(e-a)*(r-v)-(n-a)*(t-v)&&0<=(n-a)*(o-v)-(i-a)*(r-v)}function w(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function u(e,t){return e.x===t.x&&e.y===t.y}function x(e,t,n,r){var i=l(w(e,t,n)),o=l(w(e,t,r)),a=l(w(n,r,e)),v=l(w(n,r,t));return i!==o&&a!==v||(0===i&&h(e,n,t)||(0===o&&h(e,r,t)||(0===a&&h(n,e,r)||!(0!==v||!h(n,t,r)))))}function h(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function l(e){return 0<e?1:e<0?-1:0}function Z(e,t){return w(e.prev,e,e.next)<0?0<=w(e,t,e.next)&&0<=w(e,e.prev,t):w(e,t,e.prev)<0||w(e,e.next,t)<0}function S(e,t){var n=new a(e.i,e.x,e.y),r=new a(t.i,t.x,t.y),i=e.next,o=t.prev;return(e.next=t).prev=e,(n.next=i).prev=n,(r.next=n).prev=r,(o.next=r).prev=o,r}function v(e,t,n,r){n=new a(e,t,n);return r?(n.next=r.next,(n.prev=r).next.prev=n,r.next=n):(n.prev=n).next=n,n}function f(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function a(e,t,n){this.i=e,this.x=t,this.y=n,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1}function z(e,t,n,r){for(var i=0,o=t,a=n-r;o<n;o+=r)i+=(e[a]-e[o])*(e[o+1]+e[a+1]),a=o;return i}function r(e,t){var n=e.length-1,r=[e[0]];return function e(t,n,r,i,o){for(var a,v,h,l,u,x,f,s=i,c=n+1;c<r;c++){var p=(v=t[c],h=t[n],l=t[r],p=f=x=u=void 0,u=h[0],x=h[1],f=l[0]-u,p=l[1]-x,0===f&&0===p||(1<(h=((v[0]-u)*f+(v[1]-x)*p)/(f*f+p*p))?(u=l[0],x=l[1]):0<h&&(u+=f*h,x+=p*h)),(f=v[0]-u)*f+(p=v[1]-x)*p);s<p&&(a=c,s=p)}i<s&&(1<a-n&&e(t,n,a,i,o),o.push(t[a]),1<r-a&&e(t,a,r,i,o))}(e,0,n,t,r),r.push(e[n]),r}function A(e,t,n){if(e.length<=2)return e;t=void 0!==t?t*t:1;return e=r(e=n?e:function(e,t){for(var n,r,i,o,a=e[0],v=[a],h=1,l=e.length;h<l;h++)n=e[h],i=a,o=void 0,o=(r=n)[0]-i[0],i=r[1]-i[1],t<o*o+i*i&&(v.push(n),a=n);return a!==n&&v.push(n),v}(e,t),t)}function R(e,t){var n=t[0],r=t[1],t=Math.sqrt(n*n+r*r);return e[0]=n/t,e[1]=r/t,e}function s(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e}function F(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}n.deviation=function(e,t,n,r){var i=t&&t.length,o=i?t[0]*n:e.length,a=Math.abs(z(e,0,o,n));if(i)for(var v=0,h=t.length;v<h;v++){var l=t[v]*n,u=v<h-1?t[v+1]*n:e.length;a-=Math.abs(z(e,l,u,n))}for(var x=0,v=0;v<r.length;v+=3){var f=r[v]*n,s=r[v+1]*n,c=r[v+2]*n;x+=Math.abs((e[f]-e[c])*(e[1+s]-e[1+f])-(e[f]-e[s])*(e[1+c]-e[1+f]))}return 0===a&&0===x?0:Math.abs((x-a)/a)},n.flatten=function(e){for(var t=e[0][0].length,n={vertices:[],holes:[],dimensions:t},r=0,i=0;i<e.length;i++){for(var o=0;o<e[i].length;o++)for(var a=0;a<t;a++)n.vertices.push(e[i][o][a]);0<i&&(r+=e[i-1].length,n.holes.push(r))}return n},d.default=t;var c=[];function ee(e,t,n,r){var i,o,a=(o=n,(i=t)[0]*o[0]+i[1]*o[1]+i[2]*o[2]),v=Math.acos(a)*r;return s(c,n,t,-a),r=(o=i=c)[0],n=o[1],a=o[2],o=Math.sqrt(r*r+n*n+a*a),i[0]=r/o,i[1]=n/o,i[2]=a/o,a=e,o=t,t=Math.cos(v),a[0]=o[0]*t,a[1]=o[1]*t,a[2]=o[2]*t,s(e,e,c,Math.sin(v)),e}function q(e,t,n){if(n-t<3)return 0;for(var r=0,i=2*(n-1),o=2*t;o<2*n;){var a=e[i],v=e[i+1],h=e[o],l=e[o+1],i=o;o+=2,r+=a*l-h*v}return r}var B=[],U=[],L=[];function O(e,t,n,r,i,o,a,v){var h=null!=a,l=i,u=null;h&&(u=new Uint32Array(r-n));for(var x=n;x<r;x++){var f=x===r-1?n:x+1,s=x===n?r-1:x-1,c=e[2*s],p=e[2*s+1],g=e[2*x],d=e[2*x+1],s=e[2*f],f=e[2*f+1];B[0]=g-c,B[1]=d-p,U[0]=s-g,U[1]=f-d,R(B,B),R(U,U),h&&(u[x]=l),v||x!==n?v||x!==r-1?(c=U,p=B,(s=L)[0]=c[0]+p[0],s[1]=c[1]+p[1],f=L[1],L[1]=-L[0],L[0]=f,R(L,L),s=U,p=(c=L)[0]*s[0]+c[1]*s[1],f=Math.sqrt(1-p*p),c=o*Math.min(10,1/f),h&&a<1/f&&o*p<0?(s=g+L[0]*o,p=d+L[1]*o,f=Math.acos(f)/2,f=Math.tan(f)*Math.abs(o),t[2*l]=s+L[1]*f,t[2*l+1]=p-L[0]*f,t[2*++l]=s-L[1]*f,t[2*l+1]=p+L[0]*f):(t[2*l]=g+L[0]*c,t[2*l+1]=d+L[1]*c)):(L[0]=B[1],L[1]=-B[0],R(L,L),t[2*l]=g+L[0]*o,t[2*l+1]=d+L[1]*o):(L[0]=U[1],L[1]=-U[0],R(L,L),t[2*l]=g+L[0]*o,t[2*l+1]=d+L[1]*o),l++}return u}function P(e,t,n,r,i){var o=null!=r?[]:new Float32Array(e.length);if(O(e,o,0,t&&t.length?t[0]:e.length/2,0,n,r,i),t)for(var a=0;a<t.length;a++){var v=t[a];O(e,o,v,t[a+1]||e.length/2,null!=r?o.length/2:v,n,r,i)}return o}function V(e,t,n,r){for(var i=0;i<Math.floor((r-n)/2);i++)for(var o=0;o<t;o++){var a=(i+n)*t+o,v=(r-i-1)*t+o,h=e[a];e[a]=e[v],e[v]=h}return e}function W(e){e.depth=e.depth||1,e.bevelSize=e.bevelSize||0,e.bevelSegments=null==e.bevelSegments?2:e.bevelSegments,e.smoothSide=e.smoothSide||!1,e.smoothBevel=e.smoothBevel||!1,e.simplify=e.simplify||0,"number"==typeof e.depth&&(e.bevelSize=Math.min(0<e.bevelSegments?e.bevelSize:0,e.depth/2)),0<e.bevelSize||(e.bevelSegments=0),e.bevelSegments=Math.round(e.bevelSegments);var t,n,r,i,o=e.boundingRect;e.translate=e.translate||[0,0],e.scale=e.scale||[1,1],e.fitRect&&(t=null==e.fitRect.x?o.x||0:e.fitRect.x,n=null==e.fitRect.y?o.y||0:e.fitRect.y,r=e.fitRect.width,i=e.fitRect.height,null==r?null!=i?r=i/o.height*o.width:(r=o.width,i=o.height):null==i&&(i=r/o.width*o.height),e.scale=[r/o.width,i/o.height],e.translate=[(t-o.x)*e.scale[0],(n-o.y)*e.scale[1]])}function j(e,t){function n(e,t,n,r){e[0]=t,e[1]=n,e[2]=r}for(var r,i,o,a,v,h,l,u=[],x=[],f=[],s=[],c=[],p=[],g=e.length,d=new Float32Array(t.length),y=0;y<g;){var m=3*e[y++],b=3*e[y++],M=3*e[y++];n(u,t[m],t[1+m],t[2+m]),n(x,t[b],t[1+b],t[2+b]),n(f,t[M],t[1+M],t[2+M]),F(s,u,x),F(c,x,f),r=p,o=c,l=h=v=a=void 0,a=(i=s)[0],v=i[1],h=i[2],l=o[0],i=o[1],o=o[2],r[0]=v*o-h*i,r[1]=h*l-a*o,r[2]=a*i-v*l;for(var w=0;w<3;w++)d[m+w]=d[m+w]+p[w],d[b+w]=d[b+w]+p[w],d[M+w]=d[M+w]+p[w]}for(var Z,S,z,A,R,q=0;q<d.length;)n(p,d[q],d[q+1],d[q+2]),R=A=z=void 0,z=(S=Z=p)[0],A=S[1],R=S[2],S=Math.sqrt(z*z+A*A+R*R),Z[0]=z/S,Z[1]=A/S,Z[2]=R/S,d[q++]=p[0],d[q++]=p[1],d[q++]=p[2];return d}var te=[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]];function H(e,t,n,r,i,o){var a=t.vertices,v=t.topVertices,h=t.depth,t=t.rect,l=r-n,u=o.smoothSide?1:2,x=l*u,f=o.smoothBevel?1:2,s=Math.min(h/2,o.bevelSize),c=o.bevelSegments,p=i.vertex,g=Math.max(t.width,t.height,h);if(0<s)for(var d=[0,0,1],y=[],m=[0,0,-1],b=[],M=0,w=new Float32Array(l),Z=0;Z<2;Z++)for(var S=0===Z?h-s:s,z=0;z<=c*f;z++){for(var A=0,R=void 0,q=void 0,F=0;F<l;F++){for(var B=0;B<u;B++){var U=2*((F+B)%l+n);y[0]=a[U]-v[U],y[1]=a[1+U]-v[1+U],y[2]=0;var L=Math.sqrt(y[0]*y[0]+y[1]*y[1]);y[0]/=L,y[1]/=L;var O=(Math.floor(z/f)+z%f)/c;0===Z?ee(b,d,y,O):ee(b,y,m,O);var P=0===Z?O:1-O,V=s*Math.sin(P*Math.PI/2),W=L*Math.cos(P*Math.PI/2),O=s*L/Math.sqrt(V*V+W*W),P=b[0]*O+v[U],L=b[1]*O+v[1+U],V=b[2]*O+S;e.position[3*i.vertex]=P,e.position[3*i.vertex+1]=L,e.position[3*i.vertex+2]=V,(0<F||0<B)&&(A+=Math.sqrt((R-P)*(R-P)+(q-L)*(q-L))),(0<z||0<Z)&&(W=3*(i.vertex-x),U=e.position[W],O=e.position[1+W],W=e.position[2+W],w[F]+=Math.sqrt((U-P)*(U-P)+(O-L)*(O-L)+(W-V)*(W-V))),e.uv[2*i.vertex]=A/g,e.uv[2*i.vertex+1]=w[F]/g,R=P,q=L,i.vertex++}if(1<f&&z%f||1==f&&1<=z)for(var j=0;j<6;j++){var H=(te[j][0]+F*u)%x,k=te[j][1]+M;e.indices[i.index++]=(k-1)*x+H+p}}M++}else for(var I=0;I<2;I++)for(var _=0===I?h-s:s,D=0,E=void 0,C=void 0,G=0;G<l;G++)for(var J=0;J<u;J++){var K=2*((G+J)%l+n),N=a[K],K=a[1+K];e.position[3*i.vertex]=N,e.position[3*i.vertex+1]=K,e.position[3*i.vertex+2]=_,(0<G||0<J)&&(D+=Math.sqrt((E-N)*(E-N)+(C-K)*(C-K))),e.uv[2*i.vertex]=D/g,e.uv[2*i.vertex+1]=_/g,E=N,C=K,i.vertex++}for(var Q=0<s?c*f+1:1,T=0;T<l;T++)for(var X=0;X<6;X++){var Y=(te[X][0]+T*u)%x,$=te[X][1]+Q;e.indices[i.index++]=($-1)*x+Y+p}}function k(e,t){for(var n=0,r=0,i=0;i<e.length;i++){var o=e[i],a=o.indices,v=o.vertices,h=o.holes,o=o.depth,l=v.length/2,u=0<Math.min(o/2,t.bevelSize)?t.bevelSegments:0;n+=a.length*(t.excludeBottom?1:2),r+=l*(t.excludeBottom?1:2);for(var x=2+2*u,f=0,s=0,c=0;c<(h?h.length:0)+1;c++){n+=6*((s=0===c?h&&h.length?h[0]:l:(f=h[c-1],h[c]||l))-f)*(x-1);var p=(s-f)*(t.smoothSide?1:2);r+=p*x+(t.smoothBevel?0:u*p*2)}}for(var g={position:new Float32Array(3*r),indices:new(65535<r?Uint32Array:Uint16Array)(n),uv:new Float32Array(2*r)},d={vertex:0,index:0},y=0;y<e.length;y++)!function(e,t,n,r){var i=e.indices,o=e.vertices,a=e.topVertices,v=e.rect,h=e.depth;if(!(o.length<=4)){for(var l=n.vertex,u=i.length,x=0;x<u;x++)t.indices[n.index++]=l+i[x];for(var f=Math.max(v.width,v.height),s=0;s<(r.excludeBottom?1:2);s++)for(var c=0;c<a.length;c+=2){var p=a[c],g=a[c+1];t.position[3*n.vertex]=p,t.position[3*n.vertex+1]=g,t.position[3*n.vertex+2]=(1-s)*h,t.uv[2*n.vertex]=(p-v.x)/f,t.uv[2*n.vertex+1]=(g-v.y)/f,n.vertex++}if(!r.excludeBottom)for(var d=o.length/2,y=0;y<u;y+=3)for(var m=0;m<3;m++)t.indices[n.index++]=l+d+i[y+2-m]}}(e[y],g,d,t);for(var m=0;m<e.length;m++){var b,M=e[m],w=M.holes,Z=M.vertices.length/2,S=w&&w.length?w[0]:Z;if(H(g,e[m],0,S,d,t),w)for(var z=0;z<w.length;z++)b=w[z],S=w[z+1]||Z,H(g,e[m],b,S,d,t)}for(var A=0;A<g.uv.length;A++){var R=g.uv[A];0<R&&Math.round(R)===R?g.uv[A]=1:g.uv[A]=R%1}return g.normal=j(g.indices,g.position),g.boundingRect=e[0]&&e[0].rect,g}function I(e,t){t=Object.assign({},t);for(var n=[1/0,1/0],r=[-1/0,-1/0],i=0;i<e.length;i++)D(e[i][0],n,r);t.boundingRect=t.boundingRect||{x:n[0],y:n[1],width:r[0]-n[0],height:r[1]-n[1]},W(t);for(var o=[],a=t.translate||[0,0],v=t.scale||[1,1],h=t.boundingRect,l={x:h.x*v[0]+a[0],y:h.y*v[1]+a[1],width:h.width*v[0],height:h.height*v[1]},u=Math.min(h.width,h.height)/1e5,x=0;x<e.length;x++){var f=function(e,t){for(var n=[],r=0;r<e.length;r++){for(var i=e[r],o=[],a=i.length,v=i[a-1][0],h=i[a-1][1],l=0,u=0;u<a;u++){var x=i[u][0],f=i[u][1],s=x-v,c=f-h;t<(l+=Math.sqrt(s*s+c*c))&&(o.push(i[u]),l=0),v=x,h=f}3<=o.length&&n.push(o)}return 0<n.length?n:null}(e[x],u);if(f){var s=t.simplify/Math.max(v[0],v[1]);if(f=0<s?function(e,t){for(var n=[],r=0;r<e.length;r++){var i=e[r];3<=(i=A(i,t,!0)).length&&n.push(i)}return 0<n.length?n:null}(f,s):f){for(var c=d.flatten(f),p=c.vertices,s=c.holes,f=c.dimensions,g=0;g<p.length;)p[g]=p[g++]*v[0]+a[0],p[g]=p[g++]*v[1]+a[1];if(!function(e,t){var n=e.length/2,r=0,i=t&&t.length?t[0]:n;0<q(e,r,i)&&V(e,2,r,i);for(var o=1;o<(t?t.length:0)+1;o++)q(e,r=t[o-1],i=t[o]||n)<0&&V(e,2,r,i)}(p,s),2!==f)throw new Error("Only 2D polygon points are supported");c=0<t.bevelSize?P(p,s,t.bevelSize,null,!0):p,f=d(c,s,f=void 0===(f=f)?2:f);o.push({indices:f,vertices:p,topVertices:c,holes:s,rect:l,depth:"function"==typeof t.depth?t.depth(x):t.depth})}}}return k(o,t)}function _(e,t){t=Object.assign({},t);for(var n=[1/0,1/0],r=[-1/0,-1/0],i=0;i<e.length;i++)D(e[i],n,r);t.boundingRect=t.boundingRect||{x:n[0],y:n[1],width:r[0]-n[0],height:r[1]-n[1]},W(t);var o=t.scale||[1,1];null==t.lineWidth&&(t.lineWidth=1),null==t.miterLimit&&(t.miterLimit=2);for(var a=[],v=0;v<e.length;v++){var h=e[v],l=t.simplify/Math.max(o[0],o[1]);0<l&&(h=A(h,l,!0)),a.push(function(e,t,n){for(var r=n.lineWidth,i=e.length,o=new Float32Array(2*i),a=n.translate||[0,0],v=n.scale||[1,1],h=0,l=0;h<i;h++)o[l++]=e[h][0]*v[0]+a[0],o[l++]=e[h][1]*v[1]+a[1];q(o,0,i)<0&&V(o,2,0,i);var u=[],x=[],f=n.miterLimit,s=O(o,x,0,i,0,-r/2,f,!1);V(o,2,0,i);for(var c=O(o,u,0,i,0,-r/2,f,!1),r=(u.length+x.length)/2,p=new Float32Array(2*r),g=0,d=x.length/2,y=0;y<x.length;y++)p[g++]=x[y];for(var m=0;m<u.length;m++)p[g++]=u[m];for(var b=new(65535<r?Uint32Array:Uint16Array)(3*(2*(i-1)+(r-2*i))),M=0,w=0;w<i-1;w++){var Z=w+1;b[M++]=d-1-s[w],b[M++]=d-1-s[w]-1,b[M++]=c[w]+1+d,b[M++]=d-1-s[w],b[M++]=c[w]+1+d,b[M++]=c[w]+d,c[Z]-c[w]==2?(b[M++]=c[w]+2+d,b[M++]=c[w]+1+d,b[M++]=d-s[Z]-1):s[Z]-s[w]==2&&(b[M++]=c[Z]+d,b[M++]=d-1-(s[w]+1),b[M++]=d-1-(s[w]+2))}return f=0<n.bevelSize?P(p,[],n.bevelSize,null,!0):p,r=n.boundingRect,{vertices:p,indices:b,topVertices:f,rect:{x:r.x*v[0]+a[0],y:r.y*v[1]+a[1],width:r.width*v[0],height:r.height*v[1]},depth:"function"==typeof n.depth?n.depth(t):n.depth,holes:[]}}(h,v,t))}return k(a,t)}function D(e,t,n){for(var r=0;r<e.length;r++)t[0]=Math.min(e[r][0],t[0]),t[1]=Math.min(e[r][1],t[1]),n[0]=Math.max(e[r][0],n[0]),n[1]=Math.max(e[r][1],n[1])}function E(e){for(var t=new Float32Array(e),n=[],r=0,i=t.length;r<i;r+=2){var o=t[r],a=t[r+1];n.push([o,a])}return n}function C(e,t){void 0===t&&(t=!1);for(var n,r,i,o,a=e.length,v=[],h=[],l=[],u=0,x=0,f=0,s=0,c=0;c<a;c++){var p=t?(p=e[c],r=i=n=o=i=r=n=void 0,n=p.data,r=p.height,i=p.width,o=p.bottomHeight,p=_(n,{lineWidth:i,depth:r}),n=p.position,i=p.normal,r=p.uv,p=p.indices,G(n,o),{position:n,normal:i,uv:r,indices:p}):(d=e[c],b=m=y=b=g=m=y=void 0,y=d.data,m=d.height,g=d.bottomHeight,b=I(y,{depth:m}),d=b.position,y=b.normal,m=b.uv,b=b.indices,G(d,g),{position:d,normal:y,uv:m,indices:b}),g=e[c].bottomHeight||0,d=p.position,y=p.normal,m=p.uv,b=p.indices;h.push(p);b=b.length/3;l[c]=[u+1,u+b],u+=b;d=d.length/3,y=y.length/3,m=m.length/2;v[c]={position:{middleZ:g+(e[c].height||0)/2,count:d,start:x,end:x+3*d},normal:{count:y,start:f,end:f+3*y},uv:{count:m,start:s,end:s+2*m},hide:!1},x+=3*d,f+=3*y,s+=2*m}var M=function(e){for(var t={},n={},r=0;r<e.length;++r){var i,o=e[r];for(i in o)void 0===t[i]&&(t[i]=[],n[i]=0),t[i].push(o[i]),n[i]+=o[i].length}var a,v={},h=0,l=[];for(a in t)if("indices"===a)for(var u=t[a],x=0,f=u.length;x<f;x++){for(var s=u[x],c=0,p=s.length;c<p;c++)l.push(s[c]+h);h+=t.position[x].length/3}else{var g=function(e,t){for(var n=new Float32Array(t),r=0,i=0;i<e.length;++i)n.set(e[i],r),r+=e[i].length;return n}(t[a],n[a]);if(!g)return null;v[a]=g}return v.indices=new Uint32Array(l),v}(h),w=M.position,Z=M.normal,S=M.uv,M=M.indices;return{position:w.buffer,normal:Z.buffer,uv:S.buffer,indices:M.buffer,faceMap:l,geometriesAttributes:v}}function G(e,t){if(void 0!==t&&"number"==typeof t&&0!==t)for(var n=0,r=e.length;n<r;n+=3)e[n+2]+=t}e.initialize=function(){},e.onmessage=function(e,t){var n=e.data,e=n.type,r=n.datas;if("Polygon"===e){!function(e){for(var t=e.length,n=0;n<t;n++)for(var r=e[n].data,i=0,o=r.length;i<o;i++)for(var a=r[i],v=0,h=a.length;v<h;v++)e[n].data[i][v]=E(a[v])}(r);n=C(r);t(null,n,[n.position,n.normal,n.uv,n.indices])}else if("LineString"===e){for(var i=0,o=r.length;i<o;i++)for(var a=0,v=r[i].data.length;a<v;a++)r[i].data[a]=E(r[i].data[a]);e=C(r,!0);t(null,e,[e.position,e.normal,e.uv,e.indices])}},Object.defineProperty(e,"__esModule",{value:!0})}`;
    const workerName$1 = '__maptalks.three__';
    function getWorkerName$1() {
        return workerName$1;
    }
    function getWorkerCode() {
        return workerCode;
    }

    const options = {
        'renderer': 'gl',
        'doubleBuffer': false,
        'glOptions': null,
        'geometryEvents': true,
        'identifyCountOnEvent': 0,
        'forceRenderOnZooming': true,
        'loopRenderCount': 50
    };
    const RADIAN = Math.PI / 180;
    const LINEPRECISIONS = [
        [4000, 220],
        [2000, 100],
        [1000, 30],
        [500, 15],
        [100, 5],
        [50, 2],
        [10, 1],
        [5, 0.7],
        [2, 0.1],
        [1, 0.05],
        [0.5, 0.02]
    ];
    const EVENTS$1 = [
        'mousemove',
        'click',
        'mousedown',
        'mouseup',
        'dblclick',
        'contextmenu',
        'touchstart',
        'touchmove',
        'touchend'
    ];
    // const MATRIX4 = new THREE.Matrix4();
    /**
     * A Layer to render with THREE.JS (http://threejs.org), the most popular library for WebGL. <br>
     *
     * @classdesc
     * A layer to render with THREE.JS
     * @example
     *  var layer = new maptalks.ThreeLayer('three');
     *
     *  layer.prepareToDraw = function (gl, scene, camera) {
     *      var size = map.getSize();
     *      return [size.width, size.height]
     *  };
     *
     *  layer.draw = function (gl, view, scene, camera, width,height) {
     *      //...
     *  };
     *  layer.addTo(map);
     * @class
     * @category layer
     * @extends {maptalks.CanvasLayer}
     * @param {String|Number} id - layer's id
     * @param {Object} options - options defined in [options]{@link maptalks.ThreeLayer#options}
     */
    class ThreeLayer extends maptalks.CanvasLayer {
        constructor(id, options) {
            super(id, options);
            this._animationBaseObjectMap = {};
            this._needsUpdate = true;
            this._mousemoveTimeOut = 0;
            this._baseObjects = [];
            this._delayMeshes = [];
            this.type = 'ThreeLayer';
        }
        isRendering() {
            const map = this.getMap();
            if (!map) {
                return false;
            }
            return map.isInteracting() || map.isAnimating();
        }
        prepareToDraw(...args) {
        }
        /**
         * Draw method of ThreeLayer
         * In default, it calls renderScene, refresh the camera and the scene
         */
        draw() {
            this.renderScene();
        }
        /**
         * Draw method of ThreeLayer when map is interacting
         * In default, it calls renderScene, refresh the camera and the scene
         */
        drawOnInteracting() {
            this.renderScene();
        }
        /**
         * Convert a geographic coordinate to THREE Vector3
         * @param  {maptalks.Coordinate} coordinate - coordinate
         * @param {Number} [z=0] z value
         * @return {THREE.Vector3}
         */
        coordinateToVector3(coordinate, z = 0) {
            const map = this.getMap();
            if (!map) {
                return null;
            }
            if (!(coordinate instanceof maptalks.Coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            const res = getGLRes(map);
            const p = coordinateToPoint(map, coordinate, res);
            return new THREE.Vector3(p.x, p.y, z);
        }
        /**
         * Convert geographic distance to THREE Vector3
         * @param  {Number} w - width
         * @param  {Number} h - height
         * @return {THREE.Vector3}
         */
        distanceToVector3(w, h, coord) {
            if ((w === 0 && h === 0) || (!maptalks.Util.isNumber(w) || !maptalks.Util.isNumber(h))) {
                return new THREE.Vector3(0, 0, 0);
            }
            const map = this.getMap();
            const res = getGLRes(map);
            let center = coord || map.getCenter();
            if (!(center instanceof maptalks.Coordinate)) {
                center = new maptalks.Coordinate(center);
            }
            const target = map.locate(center, w, h);
            const p0 = coordinateToPoint(map, center, res), p1 = coordinateToPoint(map, target, res);
            const x = Math.abs(p1.x - p0.x) * maptalks.Util.sign(w);
            const y = Math.abs(p1.y - p0.y) * maptalks.Util.sign(h);
            return new THREE.Vector3(x, y, 0);
        }
        /**
         * Convert a Polygon or a MultiPolygon to THREE shape
         * @param  {maptalks.Polygon|maptalks.MultiPolygon} polygon - polygon or multipolygon
         * @return {THREE.Shape}
         */
        toShape(polygon) {
            if (!polygon) {
                return null;
            }
            if (polygon instanceof maptalks.MultiPolygon) {
                return polygon.getGeometries().map(c => this.toShape(c));
            }
            const center = polygon.getCenter();
            const centerPt = this.coordinateToVector3(center);
            const shell = polygon.getShell();
            const outer = shell.map(c => {
                const vector = this.coordinateToVector3(c).sub(centerPt);
                return new THREE.Vector2(vector.x, vector.y);
            });
            const shape = new THREE.Shape(outer);
            const holes = polygon.getHoles();
            if (holes && holes.length > 0) {
                shape.holes = holes.map(item => {
                    const pts = item.map(c => {
                        const vector = this.coordinateToVector3(c).sub(centerPt);
                        return new THREE.Vector2(vector.x, vector.y);
                    });
                    return new THREE.Shape(pts);
                });
            }
            return shape;
        }
        /**
         * todo   This should also be extracted as a component
         * @param {*} polygon
         * @param {*} altitude
         * @param {*} material
         * @param {*} height
         */
        toExtrudeMesh(polygon, altitude, material, height) {
            if (!polygon) {
                return null;
            }
            if (polygon instanceof maptalks.MultiPolygon) {
                return polygon.getGeometries().map(c => this.toExtrudeMesh(c, altitude, material, height));
            }
            const rings = polygon.getCoordinates();
            rings.forEach(ring => {
                const length = ring.length;
                for (let i = length - 1; i >= 1; i--) {
                    if (ring[i].equals(ring[i - 1])) {
                        ring.splice(i, 1);
                    }
                }
            });
            polygon.setCoordinates(rings);
            const shape = this.toShape(polygon);
            const center = this.coordinateToVector3(polygon.getCenter());
            height = maptalks.Util.isNumber(height) ? height : altitude;
            height = this.distanceToVector3(height, height).x;
            const amount = this.distanceToVector3(altitude, altitude).x;
            //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
            const config = { 'bevelEnabled': false, 'bevelSize': 1 };
            const name = parseInt(THREE.REVISION) >= 93 ? 'depth' : 'amount';
            config[name] = height;
            const geom = new THREE.ExtrudeGeometry(shape, config);
            let buffGeom = geom;
            if (THREE.BufferGeometry.prototype.fromGeometry) {
                buffGeom = new THREE.BufferGeometry();
                buffGeom.fromGeometry(geom);
            }
            const mesh = new THREE.Mesh(buffGeom, material);
            mesh.position.set(center.x, center.y, amount - height);
            return mesh;
        }
        /**
         *
         * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
         * @param {Object} options
         * @param {THREE.Material} material
         */
        toExtrudePolygon(polygon, options, material) {
            return new ExtrudePolygon(polygon, options, material, this);
        }
        /**
         *
         * @param {maptalks.Coordinate} coordinate
         * @param {Object} options
         * @param {THREE.Material} material
         */
        toBar(coordinate, options, material) {
            return new Bar(coordinate, options, material, this);
        }
        /**
        *
        * @param {maptalks.LineString} lineString
        * @param {Object} options
        * @param {THREE.LineMaterial} material
        */
        toLine(lineString, options, material) {
            return new Line(lineString, options, material, this);
        }
        /**
         *
         * @param {maptalks.LineString} lineString
         * @param {Object} options
         * @param {THREE.Material} material
         */
        toExtrudeLine(lineString, options, material) {
            return new ExtrudeLine(lineString, options, material, this);
        }
        /**
         *
         * @param {THREE.Mesh|THREE.Group} model
         * @param {Object} options
         */
        toModel(model, options) {
            return new Model(model, options, this);
        }
        /**
         *
         * @param {maptalks.LineString} lineString
         * @param {*} options
         * @param {THREE.Material} material
         */
        toExtrudeLineTrail(lineString, options, material) {
            return new ExtrudeLineTrail(lineString, options, material, this);
        }
        /**
         *
         * @param {*} polygons
         * @param {*} options
         * @param {*} material
         */
        toExtrudePolygons(polygons, options, material) {
            return new ExtrudePolygons(polygons, options, material, this);
        }
        /**
         *
         * @param {maptalks.Coordinate} coordinate
         * @param {*} options
         * @param {*} material
         */
        toPoint(coordinate, options, material) {
            return new Point(coordinate, options, material, this);
        }
        /**
         *
         * @param {Array} points
         * @param {*} options
         * @param {*} material
         */
        toPoints(points, options, material) {
            return new Points(points, options, material, this);
        }
        /**
         *
         * @param {Array} points
         * @param {*} options
         * @param {*} material
         */
        toBars(points, options, material) {
            return new Bars(points, options, material, this);
        }
        /**
         *
         * @param {Array[maptalks.LineString]} lineStrings
         * @param {*} options
         * @param {*} material
         */
        toExtrudeLines(lineStrings, options, material) {
            return new ExtrudeLines(lineStrings, options, material, this);
        }
        /**
         *
         * @param {Array[maptalks.LineString]} lineStrings
         * @param {*} options
         * @param {*} material
         */
        toLines(lineStrings, options, material) {
            return new Lines(lineStrings, options, material, this);
        }
        /**
         *
         * @param {*} url
         * @param {*} options
         * @param {*} getMaterial
         * @param {*} worker
         */
        toThreeVectorTileLayer(url, options, getMaterial) {
            return new ThreeVectorTileLayer(url, options, getMaterial, this);
        }
        /**
         *
         * @param {*} extent
         * @param {*} options
         * @param {*} material
         */
        toTerrain(extent, options, material) {
            return new Terrain(extent, options, material, this);
        }
        /**
         *
         * @param {*} url
         * @param {*} options
         * @param {*} material
         */
        toTerrainVectorTileLayer(url, options, material) {
            return new TerrainVectorTileLayer(url, options, material, this);
        }
        /**
         *
         * @param {*} data
         * @param {*} options
         * @param {*} material
         */
        toHeatMap(data, options, material) {
            return new HeatMap(data, options, material, this);
        }
        /**
         *
         * @param {*} lineString
         * @param {*} options
         * @param {*} material
         */
        toFatLine(lineString, options, material) {
            return new FatLine(lineString, options, material, this);
        }
        /**
         *
         * @param {*} lineStrings
         * @param {*} options
         * @param {*} material
         */
        toFatLines(lineStrings, options, material) {
            return new FatLines(lineStrings, options, material, this);
        }
        /**
         *
         * @param {*} coorindate
         * @param {*} options
         * @param {*} material
         */
        toBox(coorindate, options, material) {
            return new Box(coorindate, options, material, this);
        }
        /**
         *
         * @param {*} points
         * @param {*} options
         * @param {*} material
         */
        toBoxs(points, options, material) {
            return new Boxs(points, options, material, this);
        }
        getBaseObjects() {
            return this.getMeshes().filter((mesh => {
                return mesh instanceof BaseObject;
            }));
        }
        getMeshes() {
            const scene = this.getScene();
            if (!scene) {
                return [];
            }
            const meshes = [];
            for (let i = 0, len = scene.children.length; i < len; i++) {
                const child = scene.children[i];
                if (child instanceof THREE.Object3D && !(child instanceof THREE.Camera)) {
                    meshes.push(child['__parent'] || child);
                }
            }
            return meshes;
        }
        clear() {
            return this.clearMesh();
        }
        clearMesh() {
            const scene = this.getScene();
            if (!scene) {
                return this;
            }
            for (let i = scene.children.length - 1; i >= 0; i--) {
                const child = scene.children[i];
                if (child instanceof THREE.Object3D && !(child instanceof THREE.Camera)) {
                    scene.remove(child);
                    const parent = child['__parent'];
                    if (parent && parent instanceof BaseObject) {
                        parent.isAdd = false;
                        parent._fire('remove', { target: parent });
                        delete this._animationBaseObjectMap[child.uuid];
                    }
                }
            }
            return this;
        }
        lookAt(vector) {
            const renderer = this._getRenderer();
            if (renderer) {
                renderer.context.lookAt(vector);
            }
            return this;
        }
        getCamera() {
            const renderer = this._getRenderer();
            if (renderer) {
                return renderer.camera;
            }
            return null;
        }
        getScene() {
            const renderer = this._getRenderer();
            if (renderer) {
                return renderer.scene;
            }
            return null;
        }
        renderScene() {
            const renderer = this._getRenderer();
            if (renderer) {
                renderer.clearCanvas();
                renderer.renderScene();
            }
            return this;
        }
        loop(render = false) {
            const delayMeshes = this._delayMeshes;
            if (!delayMeshes.length) {
                return;
            }
            const map = this.getMap();
            if (!map || map.isAnimating() || map.isInteracting()) {
                return;
            }
            const loopRenderCount = this.options.loopRenderCount || 50;
            const meshes = delayMeshes.slice(0, loopRenderCount);
            if (meshes) {
                this.addMesh(meshes, render);
            }
            delayMeshes.splice(0, loopRenderCount);
        }
        renderPickScene() {
            const renderer = this._getRenderer();
            if (renderer) {
                const pick = renderer.pick;
                if (pick) {
                    pick.pick(this._containerPoint);
                }
            }
            return this;
        }
        getThreeRenderer() {
            const renderer = this._getRenderer();
            if (renderer) {
                return renderer.context;
            }
            return null;
        }
        getPick() {
            const renderer = this._getRenderer();
            if (renderer) {
                return renderer.pick;
            }
            return null;
        }
        delayAddMesh(meshes) {
            if (!meshes)
                return this;
            if (!Array.isArray(meshes)) {
                meshes = [meshes];
            }
            for (let i = 0, len = meshes.length; i < len; i++) {
                this._delayMeshes.push(meshes[i]);
            }
            return this;
        }
        /**
         * add object3ds
         * @param {BaseObject} meshes
         */
        addMesh(meshes, render = true) {
            if (!meshes)
                return this;
            if (!Array.isArray(meshes)) {
                meshes = [meshes];
            }
            const scene = this.getScene();
            meshes.forEach(mesh => {
                if (mesh instanceof BaseObject) {
                    scene.add(mesh.getObject3d());
                    if (!mesh.isAdd) {
                        mesh.isAdd = true;
                        mesh._fire('add', { target: mesh });
                    }
                    if (mesh._animation && maptalks.Util.isFunction(mesh._animation)) {
                        this._animationBaseObjectMap[mesh.getObject3d().uuid] = mesh;
                    }
                }
                else if (mesh instanceof THREE.Object3D) {
                    scene.add(mesh);
                }
            });
            this._zoomend();
            if (render) {
                this.renderScene();
            }
            return this;
        }
        /**
         * remove object3ds
         * @param {BaseObject} meshes
         */
        removeMesh(meshes, render = true) {
            if (!meshes)
                return this;
            if (!Array.isArray(meshes)) {
                meshes = [meshes];
            }
            const scene = this.getScene();
            meshes.forEach(mesh => {
                if (mesh instanceof BaseObject) {
                    scene.remove(mesh.getObject3d());
                    if (mesh.isAdd) {
                        mesh.isAdd = false;
                        mesh._fire('remove', { target: mesh });
                    }
                    if (mesh._animation && maptalks.Util.isFunction(mesh._animation)) {
                        delete this._animationBaseObjectMap[mesh.getObject3d().uuid];
                    }
                    const delayMeshes = this._delayMeshes;
                    if (delayMeshes.length) {
                        for (let i = 0, len = delayMeshes.length; i < len; i++) {
                            if (delayMeshes[i] === mesh) {
                                delayMeshes.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
                else if (mesh instanceof THREE.Object3D) {
                    scene.remove(mesh);
                }
            });
            if (render) {
                this.renderScene();
            }
            return this;
        }
        _initRaycaster() {
            if (!this._raycaster) {
                this._raycaster = new THREE.Raycaster();
                this._mouse = new THREE.Vector2();
            }
            return this;
        }
        /**
         *
         * @param {Coordinate} coordinate
         * @param {Object} options
         * @return {Array}
         */
        identify(coordinate, options) {
            if (!coordinate) {
                console.log('coordinate is null,it should be Coordinate');
                return [];
            }
            if (Array.isArray(coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            if (!(coordinate instanceof maptalks.Coordinate)) {
                console.log('coordinate type is error,it should be Coordinate');
                return [];
            }
            const p = this.getMap().coordToContainerPoint(coordinate);
            this._containerPoint = p;
            const { x, y } = p;
            this._initRaycaster();
            const raycaster = this._raycaster, mouse = this._mouse, camera = this.getCamera(), scene = this.getScene(), size = this.getMap().getSize();
            //fix Errors will be reported when the layer is not initialized
            if (!scene) {
                return [];
            }
            const width = size.width, height = size.height;
            mouse.x = (x / width) * 2 - 1;
            mouse.y = -(y / height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            //set linePrecision for THREE.Line
            setRaycasterLinePrecision(raycaster, this._getLinePrecision(this.getMap().getResolution()));
            const children = [], hasidentifyChildren = [];
            scene.children.forEach(mesh => {
                const parent = mesh['__parent'];
                if (parent && parent.getOptions) {
                    const baseObject = parent;
                    const interactive = baseObject.getOptions().interactive;
                    if (interactive && baseObject.isVisible()) {
                        //If baseobject has its own hit detection
                        if (baseObject.identify && maptalks.Util.isFunction(baseObject.identify)) {
                            hasidentifyChildren.push(baseObject);
                        }
                        else {
                            children.push(mesh);
                        }
                    }
                }
                else if (mesh instanceof THREE.Mesh || mesh instanceof THREE.Group) {
                    children.push(mesh);
                }
            });
            let baseObjects = [];
            const intersects = raycaster.intersectObjects(children, true);
            if (intersects && Array.isArray(intersects) && intersects.length) {
                baseObjects = intersects.map(intersect => {
                    let object = intersect.object;
                    object = this._recursionMesh(object) || {};
                    const baseObject = object['__parent'] || object;
                    baseObject.faceIndex = intersect.faceIndex;
                    baseObject.index = intersect.index;
                    return baseObject;
                });
            }
            this.renderPickScene();
            if (hasidentifyChildren.length) {
                hasidentifyChildren.forEach(baseObject => {
                    // baseObject identify
                    if (baseObject.identify(coordinate)) {
                        baseObjects.push(baseObject);
                    }
                });
            }
            const len = baseObjects.length;
            for (let i = 0; i < len; i++) {
                if (baseObjects[i]) {
                    for (let j = i + 1; j < len; j++) {
                        if (baseObjects[i] === baseObjects[j]) {
                            baseObjects.splice(j, 1);
                        }
                    }
                }
            }
            options = maptalks.Util.extend({}, options);
            const count = options['count'];
            return (maptalks.Util.isNumber(count) && count > 0 ? baseObjects.slice(0, count) : baseObjects);
        }
        /**
        * Recursively finding the root node of mesh,Until it is scene node
        * @param {*} mesh
        */
        _recursionMesh(mesh) {
            while (mesh && ((mesh.parent !== this.getScene()))) {
                mesh = mesh.parent;
            }
            return mesh;
        }
        //get Line Precision by Resolution
        _getLinePrecision(res = 10) {
            for (let i = 0, len = LINEPRECISIONS.length; i < len; i++) {
                const [resLevel, precision] = LINEPRECISIONS[i];
                if (res > resLevel) {
                    return precision;
                }
            }
            return 0.01;
        }
        /**
         * fire baseObject events
         * @param {*} e
         */
        _identifyBaseObjectEvents(e) {
            if (!this.options.geometryEvents) {
                return this;
            }
            const map = this.map || this.getMap();
            //When map interaction, do not carry out mouse movement detection, which can have better performance
            if (map.isInteracting() || !map.options.geometryEvents) {
                return this;
            }
            const { type, coordinate } = e;
            const now = maptalks.Util.now();
            if (this._mousemoveTimeOut && type === 'mousemove') {
                if (now - this._mousemoveTimeOut < 64) {
                    return this;
                }
            }
            this._mousemoveTimeOut = now;
            map.resetCursor('default');
            const identifyCountOnEvent = this.options['identifyCountOnEvent'];
            let count = Math.max(0, maptalks.Util.isNumber(identifyCountOnEvent) ? identifyCountOnEvent : 0);
            if (count === 0) {
                count = Infinity;
            }
            const baseObjects = this.identify(coordinate, { count });
            const scene = this.getScene();
            if (baseObjects.length === 0 && scene) {
                for (let i = 0, len = scene.children.length; i < len; i++) {
                    const child = scene.children[i] || {};
                    const parent = child['__parent'];
                    if (parent) {
                        parent.fire('empty', Object.assign({}, e, { target: parent }));
                    }
                }
            }
            if (type === 'mousemove') {
                if (baseObjects.length) {
                    map.setCursor('pointer');
                }
                // mouseout objects
                const outBaseObjects = [];
                if (this._baseObjects) {
                    this._baseObjects.forEach(baseObject => {
                        let isOut = true;
                        baseObjects.forEach(baseO => {
                            if (baseObject === baseO) {
                                isOut = false;
                            }
                        });
                        if (isOut) {
                            outBaseObjects.push(baseObject);
                        }
                    });
                }
                outBaseObjects.forEach(baseObject => {
                    if (baseObject && baseObject instanceof BaseObject) {
                        // reset _mouseover status
                        // Deal with the mergedmesh
                        if (baseObject.getSelectMesh) {
                            if (!baseObject.isHide) {
                                baseObject._mouseover = false;
                                baseObject.fire('mouseout', Object.assign({}, e, { target: baseObject, type: 'mouseout', selectMesh: null }));
                                baseObject.closeToolTip();
                            }
                        }
                        else {
                            baseObject._mouseover = false;
                            baseObject.fire('mouseout', Object.assign({}, e, { target: baseObject, type: 'mouseout' }));
                            baseObject.closeToolTip();
                        }
                    }
                });
                baseObjects.forEach(baseObject => {
                    if (baseObject instanceof BaseObject) {
                        if (!baseObject._mouseover) {
                            baseObject.fire('mouseover', Object.assign({}, e, { target: baseObject, type: 'mouseover', selectMesh: (baseObject.getSelectMesh ? baseObject.getSelectMesh() : null) }));
                            baseObject._mouseover = true;
                        }
                        baseObject.fire(type, Object.assign({}, e, { target: baseObject, selectMesh: (baseObject.getSelectMesh ? baseObject.getSelectMesh() : null) }));
                        // tooltip
                        const tooltip = baseObject.getToolTip();
                        if (tooltip && (!tooltip._owner)) {
                            tooltip.addTo(baseObject);
                        }
                        baseObject.openToolTip(coordinate);
                    }
                });
                this._baseObjects = baseObjects;
            }
            else {
                baseObjects.forEach(baseObject => {
                    if (baseObject instanceof BaseObject) {
                        baseObject.fire(type, Object.assign({}, e, { target: baseObject, selectMesh: (baseObject.getSelectMesh ? baseObject.getSelectMesh() : null) }));
                        if (type === 'click') {
                            const infoWindow = baseObject.getInfoWindow();
                            if (infoWindow && (!infoWindow._owner)) {
                                infoWindow.addTo(baseObject);
                            }
                            baseObject.openInfoWindow(coordinate);
                        }
                    }
                });
            }
            return this;
        }
        /**
         *map zoom event
         */
        _zoomend() {
            const scene = this.getScene();
            if (!scene) {
                return;
            }
            const zoom = this.getMap().getZoom();
            scene.children.forEach(mesh => {
                const parent = mesh['__parent'];
                if (parent && parent.getOptions) {
                    const baseObject = parent;
                    if (baseObject.zoomChange && maptalks.Util.isFunction(baseObject.zoomChange)) {
                        baseObject.zoomChange(zoom);
                    }
                    const minZoom = baseObject.getMinZoom(), maxZoom = baseObject.getMaxZoom();
                    if (zoom < minZoom || zoom > maxZoom) {
                        if (baseObject.isVisible()) {
                            baseObject.getObject3d().visible = false;
                        }
                        baseObject._zoomVisible = false;
                    }
                    else if (minZoom <= zoom && zoom <= maxZoom) {
                        if (baseObject._visible) {
                            baseObject.getObject3d().visible = true;
                        }
                        baseObject._zoomVisible = true;
                    }
                }
            });
        }
        onAdd() {
            super.onAdd();
            const map = this.map || this.getMap();
            if (!map)
                return this;
            EVENTS$1.forEach(event => {
                map.on(event, this._identifyBaseObjectEvents, this);
            });
            this._needsUpdate = true;
            if (!this._animationBaseObjectMap) {
                this._animationBaseObjectMap = {};
            }
            map.on('zooming zoomend', this._zoomend, this);
            return this;
        }
        onRemove() {
            super.onRemove();
            const map = this.map || this.getMap();
            if (!map)
                return this;
            EVENTS$1.forEach(event => {
                map.off(event, this._identifyBaseObjectEvents, this);
            });
            map.off('zooming zoomend', this._zoomend, this);
            return this;
        }
        _callbackBaseObjectAnimation() {
            const layer = this;
            if (layer._animationBaseObjectMap) {
                for (const uuid in layer._animationBaseObjectMap) {
                    const baseObject = layer._animationBaseObjectMap[uuid];
                    baseObject._animation();
                }
            }
            return this;
        }
        /**
         * To make map's 2d point's 1 pixel euqal with 1 pixel on XY plane in THREE's scene:
         * 1. fov is 90 and camera's z is height / 2 * scale,
         * 2. if fov is not 90, a ratio is caculated to transfer z to the equivalent when fov is 90
         * @return {Number} fov ratio on z axis
         */
        _getFovRatio() {
            const map = this.getMap();
            const fov = map.getFov();
            return Math.tan(fov / 2 * RADIAN);
        }
    }
    ThreeLayer.mergeOptions(options);
    class ThreeRenderer extends maptalks.renderer.CanvasLayerRenderer {
        constructor() {
            super(...arguments);
            this._renderTime = 0;
        }
        getPrepareParams() {
            return [this.scene, this.camera];
        }
        getDrawParams() {
            return [this.scene, this.camera];
        }
        _drawLayer() {
            super._drawLayer.apply(this, arguments);
            // this.renderScene();
        }
        hitDetect() {
            return false;
        }
        createCanvas() {
            super.createCanvas();
            this.createContext();
        }
        createContext() {
            if (this.canvas.gl && this.canvas.gl.wrap) {
                this.gl = this.canvas.gl.wrap();
            }
            else {
                const layer = this.layer;
                const attributes = layer.options.glOptions || {
                    alpha: true,
                    depth: true,
                    antialias: true,
                    stencil: true,
                    preserveDrawingBuffer: false
                };
                attributes.preserveDrawingBuffer = true;
                this.gl = this.gl || this._createGLContext(this.canvas, attributes);
            }
            this._initThreeRenderer();
            this.layer.onCanvasCreate(this.context, this.scene, this.camera);
        }
        _initThreeRenderer() {
            this.matrix4 = new THREE.Matrix4();
            const renderer = new THREE.WebGLRenderer({ 'context': this.gl, alpha: true });
            renderer.autoClear = false;
            renderer.setClearColor(new THREE.Color(1, 1, 1), 0);
            renderer.setSize(this.canvas.width, this.canvas.height);
            renderer.clear();
            // renderer.canvas = this.canvas;
            this.context = renderer;
            const scene = this.scene = new THREE.Scene();
            const map = this.layer.getMap();
            const fov = map.getFov() * Math.PI / 180;
            const camera = this.camera = new THREE.PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
            camera.matrixAutoUpdate = false;
            this._syncCamera();
            scene.add(camera);
            this.pick = new GPUPick(this.layer);
        }
        onCanvasCreate() {
            super.onCanvasCreate();
        }
        resizeCanvas(canvasSize) {
            if (!this.canvas) {
                return;
            }
            let size, map = this.getMap();
            if (!canvasSize) {
                size = map.getSize();
            }
            else {
                size = canvasSize;
            }
            // const r = maptalks.Browser.retina ? 2 : 1;
            const r = map.getDevicePixelRatio ? map.getDevicePixelRatio() : (maptalks.Browser.retina ? 2 : 1);
            const canvas = this.canvas;
            //retina support
            canvas.height = r * size['height'];
            canvas.width = r * size['width'];
            if (this.layer._canvas && canvas.style) {
                canvas.style.width = size.width + 'px';
                canvas.style.height = size.height + 'px';
            }
            this.context.setSize(canvas.width, canvas.height);
        }
        clearCanvas() {
            if (!this.canvas) {
                return;
            }
            this.context.clear();
        }
        prepareCanvas() {
            if (!this.canvas) {
                this.createCanvas();
            }
            else {
                this.clearCanvas();
            }
            this.layer.fire('renderstart', { 'context': this.context });
            return null;
        }
        renderScene() {
            const time = maptalks.Util.now();
            // Make sure to execute only once in a frame
            if (time - this._renderTime >= 16) {
                this.layer._callbackBaseObjectAnimation();
                this._renderTime = time;
            }
            this._syncCamera();
            this.context.render(this.scene, this.camera);
            this.completeRender();
        }
        remove() {
            delete this._drawContext;
            super.remove();
        }
        _syncCamera() {
            const map = this.getMap();
            const camera = this.camera;
            camera.matrix.elements = map.cameraWorldMatrix;
            camera.projectionMatrix.elements = map.projMatrix;
            //https://github.com/mrdoob/three.js/commit/d52afdd2ceafd690ac9e20917d0c968ff2fa7661
            if (this.matrix4.invert) {
                camera.projectionMatrixInverse.elements = this.matrix4.copy(camera.projectionMatrix).invert().elements;
            }
            else {
                camera.projectionMatrixInverse.elements = this.matrix4.getInverse(camera.projectionMatrix).elements;
            }
        }
        _createGLContext(canvas, options) {
            const names = ['webgl2', 'webgl', 'experimental-webgl'];
            let context = null;
            /* eslint-disable no-empty */
            for (let i = 0; i < names.length; ++i) {
                try {
                    context = canvas.getContext(names[i], options);
                }
                catch (e) { }
                if (context) {
                    break;
                }
            }
            return context;
            /* eslint-enable no-empty */
        }
    }
    ThreeLayer.registerRenderer('gl', ThreeRenderer);
    function getGLRes(map) {
        return map.getGLRes ? map.getGLRes() : map.getGLZoom();
    }
    function coordinateToPoint(map, coordinate, res) {
        if (map.coordToPointAtRes) {
            return map.coordToPointAtRes(coordinate, res);
        }
        return map.coordinateToPoint(coordinate, res);
    }
    if (maptalks.registerWorkerAdapter) {
        maptalks.registerWorkerAdapter(getWorkerName$1(), getWorkerCode());
    }

    exports.BaseObject = BaseObject;
    exports.ExtrudeUtil = ExtrudeUtil;
    exports.GeoJSONUtil = GeoJSONUtil;
    exports.GeoUtil = GeoUtil;
    exports.IdentifyUtil = IdentifyUtil;
    exports.LineMaterial = LineMaterial;
    exports.LineUtil = LineUtil;
    exports.MergeGeometryUtil = MergeGeometryUtil;
    exports.MergedMixin = MergedMixin;
    exports.ThreeLayer = ThreeLayer;
    exports.ThreeRenderer = ThreeRenderer;
    exports.geometryExtrude = main;

    Object.defineProperty(exports, '__esModule', { value: true });

    typeof console !== 'undefined' && console.log('maptalks.three v0.17.0, requires maptalks@>=0.39.0.');

})));