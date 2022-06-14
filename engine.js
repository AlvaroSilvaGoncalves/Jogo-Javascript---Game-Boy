

//Variaves do jogo
var canvas, ctx, ALTURA, LARGURA, maxPulos = 3, velocidade = 6,
    estadoAtual, record, img,

    pontosParaNovaFase = [5, 10, 15, 20],
    faseAtual = 0,

    // Sistemas de nova fase e level
    labelNovaFase = {
        texto: "",
        opacidade: 0.0,

        fadeIn: function(dt) {
           var fadeInId = setInterval(function(){  // Repete a funçao que esta especificada dentro dela em um intevalo de tempo
                if (labelNovaFase.opacidade < 1.0){
                    labelNovaFase.opacidade += 0.01;
                }
                else {
                    clearInterval(fadeInId) // Excluo a trade de cima
                }
            }, 10); 
        },

        fadeOut: function() {
            var fadeOutId = setInterval(function() {
                if (labelNovaFase.opacidade > 1.0) {
                    labelNovaFase.opacidade -= 0.01;
                }
                else {
                    clearInterval(fadeOutId);  // Para a funçao de cima
                }
            }, 1);
        },
    },

    estados = {
        jogar: 0,
        jogando: 1,
        perdeu: 2
    },

chao = {
    y: 550,
    x: 0,
    altura: 50,

    atualiza: function() {
        this.x -= velocidade;

        if (this.x <= -30) {
            this.x += 30;
        }
    },

    desenha: function() {  // Metodo que desenha o chao
        spriteChao.desenha(this.x, this.y);
        spriteChao.desenha(this.x + spriteChao.largura, this.y);
    }

},

bloco = {
    x: 50,
    y: 0,
    altura: spriteBoneco.altura,
    largura: spriteBoneco.largura,
    gravidade: 1.6,
    velocidade: 0,
    forcaDoPulo: 23.6,
    qntPulos: 0,
    score: 0,
    rotacao: 0,  // Faz com que o player fique rodando

    vidas: 3,
    colidindo: false,

    atualiza: function() {  // Metodo que realiza a força da gravidade
        this.velocidade += this.gravidade;
        this.y += this.velocidade;
        this.rotacao += Math.PI / 180 * velocidade; // Faz com que o player fique rodando

        if (this.y > chao.y - this.altura && estadoAtual != estados.perdeu) {
            this.y = chao.y - this.altura;
            this.qntPulos = 0;
            this.velocidade = 0;
        }
    },

    pula: function () {  // Metodo que faz o bloco pular
        if (this.qntPulos < maxPulos) {
            this.velocidade = -this.forcaDoPulo;
            this.qntPulos++;
        }
    },

    reset: function () {
        this.velocidade = 0;
        this.y = 0;

        if (this.score > record) {
            localStorage.setItem("record", this.score);  // Cria ou altera o valor do record e salva no valor mais alto atingido pelo jogador
            record = this.score;
        }

        this.vidas = 3;
        this.score = 0;

        velocidade = 6;
        faseAtual = 0;
        this.gravidade = 1.6;
    },

    desenha: function() {  // Metodo que desenha o bloco
        ctx.save();

        // Operacoes para rotacionar
        ctx.translate(this.x + this.largura / 2, this.y + this.altura / 2);
        ctx.rotate(this.rotacao);

        spriteBoneco.desenha(-this.largura / 2, -this.altura /2);
        ctx.restore();

    }
},

obstaculos = {
    _obs: [],
    _scored: false,
    _sprites: [redObstacle, pinkObstacle, blueObstacle, greenObstacle, yellowObstacle],
    tempoInsere: 0,

    insere: function() {
        this._obs.push({  // Insere objeto dentro do Array
            x: LARGURA,
            y: chao.y - Math.floor(20 + Math.random() * 100),  // Modifica a altura dos sriptes
            largura: 50,

            sprite: this._sprites [Math.floor(this._sprites.length * Math.random())]  // Puxa a skins do bloco
        });

        this.tempoInsere = 40 + Math.floor(31 * Math.random());

    },

    // Inseretes os obistaculos na tela
    atualiza: function () {
        if (this.tempoInsere == 0) {
            this.insere();
        }
        else {
            this.tempoInsere--;
        }

        for (var i = 0, tam = this._obs.length; i < tam; i++) {  // Rodadno todos os obistaculos na tela
            var obs = this._obs[i];
            obs.x -= velocidade;

            if (!bloco.colidindo && obs.x <= bloco.x + bloco.largura && bloco.x <= obs.x + obs.largura && obs.y <= bloco.y + bloco.altura) {
                bloco.colidindo = true;

                setTimeout(function() {
                    bloco.colidindo = false;
                }, 500)


                if (bloco.vidas >= 1) {
                    bloco.vidas --;
                }
                else {
                    estadoAtual = estados.perdeu;
                }
                
            }

            else if (obs.x <= 0 && !obs._scored) {
                bloco.score++;
                obs._scored = true;

                if (faseAtual < pontosParaNovaFase.length && bloco.score == pontosParaNovaFase [faseAtual]) {
                    passarDeFase ();
                }
            }

            else if (obs.x <= -obs.largura) {
                this._obs.splice(i, 1);
                tam--;
                i--;
            }
        }
    },

    limpa: function () {  // Zera o vetor dos obistaculos
        this._obs = []
    },

    desenha: function() {
        for (var i = 0, tam = this._obs.length; i < tam; i++) {
            var obs = this._obs[i];  // selecionando o elemento que vou desenhar
            obs.sprite.desenha(obs.x, obs.y);
        }
    },
};


function clique(event) {  
    if (estadoAtual == estados.jogando) {
        bloco.pula();
    }
    else if (estadoAtual == estados.jogar) {
        estadoAtual = estados.jogando;
    }

    else if (estadoAtual == estados.perdeu && bloco.y >= 2 * ALTURA) {
        estadoAtual = estados.jogar;
        obstaculos.limpa();
        bloco.reset();
    }
}

function passarDeFase() {
    velocidade++;
    faseAtual++;
    bloco.vidas++;

    if (faseAtual == 4) {
        bloco.gravidade *= 0.6
    }

    labelNovaFase.texto = "Level " + faseAtual;
    labelNovaFase.fadeIn(0.4);

    setTimeout(function(){
        labelNovaFase.fadeOut(0.4);
    }, 800);
        
}

function main() {  // Funçao do corpo 

    ALTURA = window.innerHeight;
    LARGURA = window.innerWidth;

    if (LARGURA >= 500) {

        LARGURA = 600;
        ALTURA = 600;

    }

    canvas = document.createElement("canvas");  // Cria o elemento canvas
    canvas.width = LARGURA; // Define a largura do canvas
    canvas.height = ALTURA;  // Define a altura do canvas

    canvas.style.border = "1px solid #000";  // Adiciona estilo no canvas
    document.body.appendChild(canvas);  // Adiciona o canvas no html
    ctx = canvas.getContext("2d");

    document.addEventListener("mousedown", clique);  // Sempre que um clique ocorrer sera executado a funçao clique

    estadoAtual = estados.jogar;
    record = localStorage.getItem("record");  // Acessa o local storage do navegar e busar um valor

    if (record == null) {
        record = 0;
    }

    // Carrego as imagens que irar ser o backgrond do jogo
    img = new Image();
    img.src = "imagens/sheet.png";

    roda();
}

function roda() {  // Funçao que roda a tela
    atualiza();
    desenha();

    window.requestAnimationFrame(roda);
}

function atualiza () {  // Funçao que atualiza os frames

    if (estadoAtual == estados.jogando) {  // Atualiza os obistaculos na tela enquando o jogo esta sendo executado
        obstaculos.atualiza();
    }

    chao.atualiza();
    bloco.atualiza();
}

function desenha () {  // Funçao que desenha na tela

    bg.desenha(0, 0);  // Usa a imagem para desenhar o fundo 
    
    ctx.fillStyle = "#fff";
    ctx.font = "50px Arial";

    ctx.fillText("Pontos ", 10, 68);
    ctx.fillText(bloco.score, 170, 68);

    ctx.fillText("Vidas ", 400, 66);
    ctx.fillText(bloco.vidas, 540, 68);

    ctx.fillText(labelNovaFase.texto, 225, 130);

    if (estadoAtual == estados.jogando) {
        obstaculos.desenha();
    }

    chao.desenha();
    bloco.desenha();

    // Desenhando atraves de Cordenadas as skins na tela
    if (estadoAtual == estados.jogar) {
        jogar.desenha(LARGURA / 2 - jogar.largura / 2, ALTURA / 2 - jogar.altura / 2);
    }

    if (estadoAtual == estados.perdeu) {
        perdeu.desenha(LARGURA / 2 - perdeu.largura / 2, ALTURA / 2 - perdeu.altura / 2 - spriteRecord.altura / 2);
        spriteRecord.desenha(LARGURA / 2 - spriteRecord.largura / 2, ALTURA / 2 + perdeu.altura / 2 - spriteRecord.altura / 2 - 25);

        ctx.fillStyle = "#fff";
        ctx.fillText(bloco.score, 375, 390);
        
        if (bloco.score > record) {
            novo.desenha(LARGURA / 2 - 180, ALTURA / 2 + 30);
            ctx.fillText(bloco.score, 420, 470);
        }

        else {
            ctx.fillText(record, 420, 470);
        }
    }

}

// Inicializa o jogo
main();