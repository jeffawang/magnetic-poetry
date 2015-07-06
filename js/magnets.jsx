var width = height = 900;
var magnetBoard

d3.json("/data/words.json", function(err, data) {
    if (err !== null) return console.warn(err)
    magnetBoard = React.render(<Board words={data} />, document.getElementById("wrapper"))
})

var Board = React.createClass({
    grabbedMouseMove: function(index, startCoords, event) {
        var nodeData = this.state.wordList[index]
        var maxX = width - nodeData.w
        var maxY = height - nodeData.h
        var dragX = startCoords.x + event.clientX - startCoords.clientX
        var dragY = startCoords.y + event.clientY - startCoords.clientY
        var newX = Math.max(0, Math.min(maxX, dragX))
        var newY = Math.max(0, Math.min(maxY, dragY))
        this.setState({x: newX, y: newY})
    },
    grabbedMouseDown: function(index, event) {
        var node = React.findDOMNode(this) // board
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
        this.setState({grabbing: true, grabbedId: index})
    },
    grabbedMouseUp: function(mouseMoveFunc, event) {
        this.setState({grabbing: false})
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
                    w: 0,
                    h: 0,
                    selectedWordIndex: 0,
                    grabbing: false,
                }
            })
        }
        return wordListObject
    },

    reportOffsets(index, offsets) {
        // calling offsetHeight and offsetWidth from the DOM
        // causes recalculation and/or reflow, so cache it.
        this.state.wordList[index].w = offsets[0]
        this.state.wordList[index].h = offsets[1]
    },

    xyBound: function(index, dim, by) {
        this.state.wordList[index][dim] += by
        this.setState(this.state)
    },

    render: function() {
        var cx = React.addons.classSet
        var myClasses = cx({board: true, grabbing: this.state.grabbing})
        var magnets = this.state.wordList.map(function(d, i) {
            return <Magnet
                    ref={i}
                    data={d}
                    above={this.state.grabbing && this.state.grabbedId === i}
                    grabbedMouseDown={this.grabbedMouseDown.bind(this, d.id)}
                    reportOffsets={this.reportOffsets}
                    xyBound={this.xyBound}
                    />
        }, this)
        return <div id="board" className={myClasses} >
                   {magnets}
               </div>
    }
});

var Magnet = React.createClass({
    getInitialState: function() {
        return this.makeStyle()
    },
    makeStyle: function() {
        newStyle = {
                left:   this.props.data.x + "px",
                top:    this.props.data.y + "px"
        }
        return newStyle
    },
    componentDidMount: function() {
        var node = React.findDOMNode(this)
        var w = node.offsetWidth
        var h = node.offsetHeight
        var xCorrect = this.props.data.x + w - width
        var yCorrect = this.props.data.y + h - height
        this.props.reportOffsets(this.props.data.id, [w,h])
        if ( xCorrect > 0 ) this.props.xyBound(this.props.data.id, "x", -xCorrect)
        if ( yCorrect > 0 ) this.props.xyBound(this.props.data.id, "y", -yCorrect)
    },
    render: function() {
        var omg = {"left": "100px"}
        var cx = React.addons.classSet
        var myClasses = cx({magnet: true, grabbable: true, above: this.props.above})
        return <div
                className={myClasses}
                style={this.makeStyle()}
                onMouseDown={this.props.grabbedMouseDown}
                >
                   {this.props.data.word}
               </div>
    }
})

