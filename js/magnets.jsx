var width = height = 900;

d3.json("/data/words.json", function(err, data) {
    if (err !== null) return console.warn(err)
    React.render(<Board words={data} />, document.getElementById("wrapper"))
})

var Board = React.createClass({
    grabbedMouseMove: function(index, startCoords, event) {
        this.state.wordList[index].x = startCoords.x + event.clientX - startCoords.clientX
        this.state.wordList[index].y = startCoords.y + event.clientY - startCoords.clientY
        this.setState(this.state)
    },
    grabbedMouseDown: function(index, event) {
        var node = React.findDOMNode(this)
        var startCoords = {
            x: this.state.wordList[index].x,
            y: this.state.wordList[index].y,
            clientX: event.clientX,
            clientY: event.clientY
        }
        var newMouseMove = this.grabbedMouseMove.bind(this, index, startCoords)
        var newMouseUp = this.grabbedMouseUp.bind(this, newMouseMove)
        node.addEventListener("mousemove", newMouseMove, false)
        node.addEventListener("mouseup", newMouseUp, false)
    },
    grabbedMouseUp: function(mouseMoveFunc, event) {
        node = React.findDOMNode(this)
        node.removeEventListener("mousemove", mouseMoveFunc)
        node.removeEventListener(event.type, arguments.callee) // For some reason this doesn't work!!
    },
    getInitialState: function() {
        var wordListObject = {
            wordList: this.props.words.map(function(d, i) {
                return {
                    id: i,
                    word: d,
                    x: Math.random() * width,
                    y: Math.random() * height,
                    selectedWordIndex: 0,
                    grabbing: false
                }
            })
        }
        return wordListObject
    },

    render: function() {
        var cx = React.addons.classSet
        var myClasses = cx({board: true, grabbing: this.state.grabbing})
        var magnets = this.state.wordList.map(function(d, i) {
            return <Magnet
                ref={i}
                data={d}
                grabbedMouseDown={this.grabbedMouseDown.bind(this, d.id)}
                />
        }, this)
        return <div id="board" >
            {magnets}
        </div>
    }
});

var Magnet = React.createClass({
    getInitialState: function() {
        return this.makeStyle()
    },
    makeStyle: function() {
        this.grabbingMe = this.props.selectedWordIndex === this.props.wordid && this.props.grabbing
        newStyle = {
                zIndex: this.grabbingMe ? 1 : 0,
                left:   this.props.data.x + "px",
                top:    this.props.data.y + "px"
        }
        return newStyle
    },
    render: function() {
        var omg = {"left": "100px"}
        var cx = React.addons.classSet
        var myClasses = cx({magnet: true, grabbable: true})
        return <div className={myClasses} style={this.makeStyle()} onMouseDown={this.props.grabbedMouseDown}>
            {this.props.data.word}
        </div>
    }
})

