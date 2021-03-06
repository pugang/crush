window._tileSize = 48;
window._horizontalTiles = 15;
window._verticalTiles = 10;
window._pointerHeight = 60;
window._piecesImages = {};

var Canvas = this.__canvas = new fabric.Canvas(
    'canvas',
    {
        hoverCursor: 'pointer',
        selection: false,
        width: (window._horizontalTiles * window._tileSize) + 1,
        height: (window._verticalTiles * window._tileSize) + 1 + window._pointerHeight
    }
);

// fabric.Sprite.fromURL(
//     'explosion.png',
//     function(sprite) {
//         sprite.set({
//             left: 0,
//             top: 0,
//             width: 48,
//             height: 48
//         });
//         Canvas.add(sprite);
//         sprite.play();

//         (function render() {
//             Canvas.renderAll();
//             fabric.util.requestAnimFrame(render);
//         })();
//     },
//     {
//         spriteWidth: 48,
//         spriteHeight: 48
//     }
// );

var Sound = {
    playMove: function() {
        var sound = new Audio('move.wav');
        sound.play();
    }
};

var Logger = {
    log: function(message) {
        if (console !== undefined && console.log !== undefined) {
            console.log(message);
        }
    }
};

var Pointer = function() {

    var self = this;

    this.movements = 0;
    this.piecesDestroyed = 0;

    var createDoll = function()
    {
        return new fabric.Text(
            self.piecesDestroyed + ' pieces ' + self.movements + ' movements',
            {
                left: (window._horizontalTiles * window._tileSize) / 2,
                top: (window._verticalTiles * window._tileSize) + 1,
                textAlign: 'center',
                originX: 'center',
                fontFamily: 'Arial'
            }
        );
    };

    this.update = function() {
        if (self.doll) {
            Canvas.remove(self.doll);
        }
        self.doll = createDoll();
        Canvas.add(self.doll);
    };

    this.update();
};

var Game = function() {

    var tileSize = window._tileSize;
    var horizontalTiles = window._horizontalTiles;
    var verticalTiles = window._verticalTiles;
    var board = new Board(this, horizontalTiles, verticalTiles, tileSize);
    var pointer = new Pointer();

    var currentPiece = null;

    self = this;

    document.getElementById('container').style.width = (horizontalTiles * tileSize) + 1 + 'px';
    document.getElementById('container').style.height = (verticalTiles * tileSize) + 1 + 'px';

    this.getBoard = function() {
        return board;
    };

    this.getPointer = function() {
        return pointer;
    };

    this.setCurrentPiece = function(row, column) {
        currentPiece = self.getBoard().getPiece(row, column);
    };

    this.getCurrentPiece = function() {
        return currentPiece;
    };

    Canvas.on(
        {
            'mouse:down': function(options) {

                window._mouseBeginningX = options.e.offsetX;
                window._mouseBeginningY = options.e.offsetY;

                self.setCurrentPiece(
                    self.getBoard().getRowAt(options.e.offsetY),
                    self.getBoard().getColumnAt(options.e.offsetX)
                );
            },
            'mouse:up': function(options) {

                var movedPiece = self.getCurrentPiece();

                if (!movedPiece) {
                    return false;
                }

                var board = self.getBoard();

                var oldRow = movedPiece.getRow();
                var oldColumn = movedPiece.getColumn();

                var mouseRow = board.getRowAt(options.e.offsetY);
                var mouseColumn = board.getColumnAt(options.e.offsetX);

                // Moved outside board
                if (!board.checkPosition(mouseRow, mouseColumn)) {

                    return false;
                    // @TODO play "failure" sound
                }

                // Moved mouse outside initial place
                if (mouseRow == oldRow && mouseColumn == oldColumn) {
                    return false;
                }

                var newRow = oldRow;
                var newColumn = oldColumn;

                // Limit row movement to 1 position
                // diagonal become either up or down
                if (mouseRow < oldRow) {
                    newRow--;
                } else if (mouseRow > oldRow) {
                    newRow++;
                } else if (mouseColumn > oldColumn) {
                    newColumn++;
                } else {
                    newColumn--;
                }

                // If it explodes the board limit, does nothing
                var firstRow = 0;
                var firstColumn = 0;
                var lastRow = board.getLastRow();
                var lastColumn = board.getLastColumn();

                if (!board.checkPosition(newRow, newColumn)) {

                    return false;
                    // @TODO play "failure" sound
                }

                if (newRow == oldRow && newColumn == oldColumn) {
                    return false;
                }

                var replacedPiece = self.getBoard().getPiece(newRow, newColumn);

                board.move(movedPiece, replacedPiece, function(){
                    if (board.getMatches().length > 0) {

                        board.animateRemoveMatches();

                        pointer.movements++;
                        pointer.update();

                        // Play sound
                        Sound.playMove();

                    } else {
                        // Move back
                        board.move(replacedPiece, movedPiece);
                    }
                });
            }
        }
    );
};

var Piece = function(_board, _row, _column) {

    var self = this;

    var types = {
        1: 'pieces/01.png',
        2: 'pieces/02.png',
        3: 'pieces/03.png',
        4: 'pieces/04.png',
        5: 'pieces/05.png',
        6: 'pieces/06.png',
    };

    this.type = Math.floor(Math.random() * 6) + 1;

    var color = this.color = types[this.type];
    var board = _board;

    this.row = _row;
    this.column = _column;
    this.locked = false;
    // this.doll = self.doll = new fabric.Circle({
    //     top: (self.row * board.tileSize) + 1,
    //     left: (self.column * board.tileSize) + 1,
    //     radius: (board.tileSize/2) - 1,
    //     fill: color,
    //     selectable: false
    // });

    self.doll = new fabric.Image(
        window._piecesImages[self.type],
        {
            top: (self.row * board.tileSize) + 1,
            left: (self.column * board.tileSize) + 1,
            selectable: false
        }
    );

    this.getRow = function() {
        return self.row;
    };

    this.getColumn = function() {
        return self.column;
    };

    this.move = function(newRow, newColumn, callback)
    {
        self.getDoll().bringToFront();
        self.row = newRow;
        self.column = newColumn;

        self.getDoll().animate(
            {
                left: 1 + (newColumn * window._tileSize),
                top: 1 + (newRow * window._tileSize)
            },
            {
                duration: 250,
                onChange: Canvas.renderAll.bind(Canvas),
                onComplete: callback
            }
        );
    };

    this.getDoll = function() {
        return self.doll;
    };

    this.getUpperPiece = function() {
        return board.getPiece(self.row - 1, self.column);
    };

    this.regenerate = function() {

        // Remove image
        Canvas.remove(self.doll);

        // Create new piece
        var piece = new Piece(board, self.row, self.column);
        board.pieces[self.row][self.column] = piece;
        Canvas.add(piece.getDoll());
    };

    this.animateDestroy = function() {

        // @TODO play sound and explosion animation
        // Remove image
        Canvas.remove(self.doll);

        board.pieces[self.row][self.column] = null;
    };
};

var Board = function(game, width, height, tileSize) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.pieces = [];
    this.game = game;

    var self = this;

    for (var row = 0; row < height; row++) {

        var rowPieces = [];

        for (var column = 0; column < width; column++) {

            var piece = new Piece(this, row, column);
            var top = row * tileSize;
            var left = column * tileSize;

            // Add piece
            rowPieces.push(piece);

            Canvas.add(
                // Draw cell
                new fabric.Rect({
                    top: top,
                    left: left,
                    width: tileSize,
                    height: tileSize,
                    fill: 'rgba(255,255,255,0.2)',
                    //stroke: '#000',
                    selectable: false
                })
            );

            Canvas.add(
                // Draw piece
                piece.getDoll()
            );
        }

        this.pieces.push(rowPieces);
    }

    this.getPiece = function(row, column) {

        if (self.pieces[row] !== undefined && self.pieces[row][column] !== undefined) {
            return self.pieces[row][column];
        }

        return false;
    };

    this.getRowAt = function(top) {
        return Math.floor(top / window._tileSize);
    };

    this.getColumnAt = function(left) {
        return Math.floor(left / window._tileSize);
    };

    this.getLastRow = function() {
        return window._verticalTiles - 1;
    };

    this.getLastColumn = function() {
        return window._horizontalTiles - 1;
    };

    this.getMatches = function() {
        var repeatedPieces = {};

        // Horizontal matches
        for (var row in self.pieces) {

            var previousColor = null;
            var repeatedColor = 1;

            for (var column in self.pieces[row]) {

                var current = self.pieces[row][column];

                if (previousColor === current.color) {
                    repeatedColor++;
                } else {
                    repeatedColor = 1;
                    previousColor = current.color;
                }

                if (repeatedColor > 3) {
                    repeatedPieces[row + ':' + column] = current;
                } else if (repeatedColor == 3) {
                    repeatedPieces[row + ':' + column] = current;
                    repeatedPieces[row + ':' + (column-1)] = self.pieces[row][column-1];
                    repeatedPieces[row + ':' + (column-2)] = self.pieces[row][column-2];
                }
            }
        }

        // Vertical matches
        for (var column = 0; column < window._horizontalTiles; column++) {

            var previousColor = null;
            var repeatedColor = 1;

            for (var row = 0; row < window._verticalTiles; row++) {

                var current = self.pieces[row][column];

                if (previousColor === current.color) {
                    repeatedColor++;
                } else {
                    repeatedColor = 1;
                    previousColor = current.color;
                }

                if (repeatedColor > 3) {
                    repeatedPieces[row + ':' + column] = current;
                } else if (repeatedColor == 3) {
                    repeatedPieces[row + ':' + column] = current;
                    repeatedPieces[(row-1) + ':' + column] = self.pieces[row-1][column];
                    repeatedPieces[(row-2) + ':' + column] = self.pieces[row-2][column];
                }
            }
        }

        var pieces = [];

        for (k in repeatedPieces) {
            pieces.push(repeatedPieces[k]);
        }

        return pieces;
    };

    this.hasEmptyCells = function() {
        var empty = 0;
        for (var column = 0; column < window._horizontalTiles; column++) {
            for (var row = 0; row < window._verticalTiles; row++) {
                if (self.pieces[row][column] == null) {
                    empty++;
                }
            }
        }
        return empty;
    };

    this.dropPieces = function() {

        for (var column = 0; column < window._horizontalTiles; column++) {

            for (var row = (window._verticalTiles - 1); row >= 0; row--) {

                var piece = self.pieces[row][column];

                if (piece == null) {

                    // Firt row creates new pieces
                    if (row == 0) {

                        piece = new Piece(self, row, column);
                        self.pieces[row][column] = piece;

                        Canvas.add(piece.getDoll());
                        piece.getDoll().setTop(-window._tileSize);
                        piece.move(row, column);

                    } else {

                        var upper = self.getPiece(row - 1, column);

                        if (upper) {

                            upper.move(row, column);

                            self.pieces[row - 1][column] = null;
                            self.pieces[row][column] = upper;
                        }
                    }
                }
            }
        }
    };

    this.animateRemoveMatches = function() {

        var repeatedPieces = self.getMatches();

        var removedPieces = 0;

        for (var k in repeatedPieces) {

            repeatedPieces[k].animateDestroy();
            removedPieces++;
        }

        game.getPointer().piecesDestroyed += removedPieces;
        game.getPointer().update();

        // Drop pieces
        while (self.hasEmptyCells()) {
            self.dropPieces();
        }

        while (self.getMatches().length > 0) {
            self.animateRemoveMatches();
        }
    };

    this.removeMatches = function() {

        var repeatedPieces = self.getMatches();

        for (var k in repeatedPieces) {
            repeatedPieces[k].regenerate();

        }

        return repeatedPieces.length;
    };

    this.move = function(piece1, piece2, callback) {

        var oldRow    = piece1.row;
        var oldColumn = piece1.column;

        var newRow    = piece2.row;
        var newColumn = piece2.column;

        self.pieces[oldRow][oldColumn] = piece2;
        self.pieces[newRow][newColumn] = piece1;

        piece1.move(newRow, newColumn);
        piece2.move(oldRow, oldColumn, callback);
    };

    this.checkPosition = function(newRow, newColumn) {
        var firstRow = 0;
        var firstColumn = 0;
        var lastRow = self.getLastRow();
        var lastColumn = self.getLastColumn();

        if (
            newRow < firstRow
            || newRow > lastRow
            || newColumn < firstColumn
            || newColumn > lastColumn
            ) {

            return false;
        } else {
            return true;
        }
    };

    // Load without repeated pieces
    while (self.getMatches().length > 0) {
        self.removeMatches();
    }
};



fabric.Image.fromURL(
    'pieces/01.png',
    function(sprite) {
        window._piecesImages[1] = sprite.getElement();

        fabric.Image.fromURL(
            'pieces/02.png',
            function(sprite) {
                window._piecesImages[2] = sprite.getElement();

                fabric.Image.fromURL(
                    'pieces/03.png',
                    function(sprite) {
                        window._piecesImages[3] = sprite.getElement();

                        fabric.Image.fromURL(
                            'pieces/04.png',
                            function(sprite) {
                                window._piecesImages[4] = sprite.getElement();

                                fabric.Image.fromURL(
                                    'pieces/05.png',
                                    function(sprite) {
                                        window._piecesImages[5] = sprite.getElement();

                                        fabric.Image.fromURL(
                                            'pieces/06.png',
                                            function(sprite) {
                                                window._piecesImages[6] = sprite.getElement();

                                                new Game();
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);
