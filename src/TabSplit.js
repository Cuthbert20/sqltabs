/*
  Copyright (C) 2015  Aliaksandr Aliashkevich

      This program is free software: you can redistribute it and/or modify
      it under the terms of the GNU General Public License as published by
      the Free Software Foundation, either version 3 of the License, or
      (at your option) any later version.

      This program is distributed in the hope that it will be useful,
      but WITHOUT ANY WARRANTY; without even the implied warranty of
      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
      GNU General Public License for more details.

      You should have received a copy of the GNU General Public License
      along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var React = require('react');
var ReactDOM = require('react-dom');
var TabActions = require('./Actions');
var TabsStore = require('./TabsStore');

var Splitter = React.createClass({

    render: function(){
        if (this.props.type == 'horizontal'){
            var classname = "hsplitter";
        } else if (this.props.type == "vertical" ) {
            var classname = "vsplitter";
        } else  {
            return <div style={{widht: '0%', height: '0%'}}/>;
        }

        return (
            <div className={classname}
                onMouseDown={this.props.mouseDownHandler}
                onMouseMove={this.props.mouseMoveHandler}
                onMouseUp={this.props.mouseUpHandler}
            />
        );
    }
});

var Container = React.createClass({

    render: function(){
        return (
        <div className="tab-split-container" style={this.props.style}>
            {this.props.children}
        </div>
        );
    },
});

var TabSplit = React.createClass({

    getInitialState: function(){

        if (typeof(this.props.type) == 'undefined'){
            var type = "horizontal";
        } else {
            var type = this.props.type;
        }

        return {
            drag: false,
            type: type,
            project_visible: false,
        };
    },

    main_container: null,
    first_container: null,
    second_container: null,
    splitter: null,

    resizeContainers: function(){
        const main_size = this.main_container.getBoundingClientRect();
        const splitter_size = this.splitter.getBoundingClientRect();

        if (this.state.resize_type == 'hide_project' && this.props.project) {
            // after project hides show the sql area full width
            this.second_container.style.width = 'calc(100%)';
        }

    },

    horizontalResize: function(e){
        main_size = this.main_container.getBoundingClientRect();
        var h1 = e.pageY - this.first_container.getBoundingClientRect().top;
        var h_max = main_size.bottom - main_size.top - e.pageY;
        var h2 = this.main_container.getBoundingClientRect().height - h1 - this.splitter.getBoundingClientRect().height;

        if (h1 > 15 && h_max > 15) {
            this.first_container.style.width = "calc(100%)";
            this.second_container.style.width = "calc(100%)";
            this.first_container.style.height = h1/main_size.height*100+'%';
            this.second_container.style.height = h2/main_size.height*100+'%';
            TabActions.resize(this.props.eventKey);
        }
    },

    verticalResize: function(e){
        main_size = this.main_container.getBoundingClientRect();
        var w1 = e.pageX - this.first_container.getBoundingClientRect().left;
        var w_max = main_size.right - e.pageX;
        var w_main = this.main_container.getBoundingClientRect().width;
        var w_splitter = this.splitter.getBoundingClientRect().width;
        var w2 = w_main - w1 - w_splitter;

        if (w1 > 15 && w_max > 15) {
            this.first_container.style.height = "calc(100%)";
            this.second_container.style.height = "calc(100%)";
            this.first_container.style.width = w1/main_size.width*100+'%';
            this.second_container.style.width = w2/main_size.width*100+'%';
            TabActions.resize(this.props.eventKey);
        }
    },

    componentDidMount: function(){

        if (this.props.project){
            TabsStore.bind('show-project-'+this.props.eventKey, this.showProjectHandler);
            TabsStore.bind('hide-project-'+this.props.eventKey, this.hideProjectHandler);
            TabsStore.bind('toggle-project-'+this.props.eventKey, this.toggleProjectHandler);
        } else {
            TabsStore.bind('switch-view-'+this.props.eventKey, this.switchViewHandler);
            TabsStore.bind('editor-resize', this.resizeHandler);
        }

        this.main_container.style.height = this.main_container.getBoundingClientRect().height+'px';

    },

    componentDidUpdate: function(){
        if (this.make_resize){
            this.make_resize = false;
            this.resizeContainers();
        }
    },

    componentWillUnmount: function(){
        if (this.props.project){
            TabsStore.unbind('show-project-'+this.props.eventKey, this.showProjectHandler);
            TabsStore.unbind('hide-project-'+this.props.eventKey, this.hideProjectHandler);
            TabsStore.unbind('toggle-project-'+this.props.eventKey, this.toggleProjectHandler);
        } else {
            TabsStore.unbind('switch-view-'+this.props.eventKey, this.switchViewHandler);
        }
    },

    resizeHandler: function(){
        // handle risize of outer container for vertical view
        if (this.state.type == 'vertical' && !this.state.project_visible){
            //this.main_container.style.flexDirection = 'row';
            //this.first_container.style.width = '50%';
        }
    },

    switchViewHandler: function(){
        this.make_resize = true;
        if (this.state.type == 'horizontal'){
            this.setState({
                type: 'vertical',
                resize_type: 'switch_view',
            });
        } else {
            this.setState({
                type: 'horizontal',
                resize_type: 'switch_view',
            });
        }
        TabActions.resize(this.props.eventKey);
    },

    showProjectHandler: function(){
        this.make_resize = true;
        this.setState({
            project_visible: true,
            resize_type: 'show_project',
        });
        TabActions.resize(this.props.eventKey);
    },

    hideProjectHandler: function(){
        this.make_resize = true;
        this.setState({
            project_visible: false,
            resize_type: 'hide_project',
        });
        TabActions.resize(this.props.eventKey);
    },

    toggleProjectHandler: function(){
        if (this.state.project_visible){
            this.hideProjectHandler();
        } else {
            this.showProjectHandler();
        }
    },

    mouseDownHandler: function(e){
        e.stopPropagation();
        e.preventDefault();
        this.setState({drag: true});
    },

    mouseMoveHandler: function(e){
        if (!this.state.drag){
            return;
        }
        if (this.state.type == 'horizontal'){
            this.horizontalResize(e);
        } else { // vertical
            this.verticalResize(e);
        }
    },

    mouseUpHandler: function(e){
        e.stopPropagation();
        e.preventDefault();
        this.setState({drag: false});
    },

    mouseLeaveHandler: function(e){
        e.stopPropagation();
        e.preventDefault();
        this.setState({drag: false});
    },

    render: function(){

        if (this.props.project){ // for project window
            var flex_direction = 'row';

            if (this.state.project_visible){
                var splitter_type = "vertical";
                var first_style = {
                    width: "calc(20%)",
                    height: "calc(100%)",
                    minHeight: "calc(100%)",
                };
                var second_style = {
                    //width: "calc(100%)",
                    //height: "calc(100%)",
                    //minHeight: "calc(100%)",
                    flex: 1,
                };
            } else {
                var splitter_type = "invisible";
                var first_style = {
                    width: "0%",
                    height: "calc(100%)",
                    minHeight: "calc(100%)",
                };
                var second_style = {
                    //width: "calc(100%)",
                    //height: "calc(100%)",
                    //minHeight: "calc(100%)",
                    flex: 1,
                };
            }

        } else { // for sql area

            if (this.state.type == 'vertical'){
                var flex_direction = 'row';
                var first_style = {
                    width: "50%",
                    height: "100%",
                };
                var second_style = {
                    width: "50%",
                    height: "100%",
                };
            } else {
                var flex_direction = 'column';
                var first_style = {
                    width: "100%",
                    height: "50%",
                };
                var second_style = {
                    width: "100%",
                    flex: "1",
                };
            }
            var splitter_type = this.state.type;
        }


        main_style = {
            width: "100%",
            height: "calc(100%)",
            minHeight: "calc(100%)",
            flexDirection: flex_direction,
        }


        return (
        <div className="tab-split"
          ref={ item => { this.main_container = ReactDOM.findDOMNode(item); } }
          style={ main_style }
          onMouseMove={this.mouseMoveHandler}
          onMouseUp={this.mouseUpHandler}
          onMouseLeave={this.mouseLeaveHandler}
        >

          <Container ref={ item => { this.first_container = ReactDOM.findDOMNode(item); } } type={this.state.type} style={first_style}>
            {this.props.children[0]}
          </Container>

          <Splitter ref={ item => { this.splitter = ReactDOM.findDOMNode(item); } } type={splitter_type}
              mouseDownHandler={this.mouseDownHandler}
          />

          <Container ref={ item => { this.second_container = ReactDOM.findDOMNode(item); } } type={this.state.type} style={second_style}>
            {this.props.children[1]}
          </Container>

        </div>
        );

    },
});


module.exports = TabSplit;
