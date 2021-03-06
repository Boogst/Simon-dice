/*Las ventajas en algunas situaciones traen desventajas en otras. No puede usar una función de flecha cuando se requiere 
un contexto dinámico: definir métodos, crear objetos con 
constructores, obtener el objetivo this al manejar eventos.*/
"use strict"

const gameboard = document.querySelector('.gameboard')
const tiempo = document.getElementById('tiempo');
const nivel = document.getElementById('nivel');
const puntos = document.getElementById('puntos');
const barraProgreso = document.getElementById('barraProgreso');
const blip = zounds.load("sounds/blip.wav");
const boton = document.getElementById('botonEmpezar');

//2212
const ULTIMO_NIVEL = 10;
const TOTAL_PUNTOS = 10;
const TIEMPO_MAX = 15;

const delay = time => new Promise(resolveCallback => setTimeout(resolveCallback, time));

tiempo.innerHTML = TIEMPO_MAX;

class Juego{

    constructor(){
  
        this.inicializar(); //este método siempre va dentro del constructor.
        this.generarSecuencia();
        delay(500) //Al pasar la funcion como referencia se pierde el contexto, recuerda poner .bind() para que no pierda el contexto
            .then(this.siguienteNivel); 
    }

    inicializar(){

        //De esta manera elegirColor siempre va a estar atada a la clase o objeto JUEGO
        //No va a poder cambiar el contexto no importa si lo llama el navegador, settimeOut siemppre this estara atada al juego.
        //Por lo general esto pasa cuando pasamos un callback por referencia, por ejemplo .then(algo)
        //para evitar que se pierda el contexto podemos usar .then( () => algo() );
        //o simplemente this.algo = this.algo.bind(this) asi nunca perdemos el contexto.
        this.siguienteNivel = this.siguienteNivel.bind(this);
        this.elegirColor = this.elegirColor.bind(this); //ESTO ES PARA CAMBIAR EL CONTEXTO, bind(this | juego) para atar la funcion al objeto del juego.
        boton.classList.toggle('hide');
        
        this.nivel = 1;
        nivel.innerHTML = this.nivel;
        puntos.innerHTML = 0;

        this.actualizarProgreso(0);
    }

    generarSecuencia(){
                        //generar array de 10 elemeto, luego colocando el valor 0 a cada elemento
        this.secuencia = new Array(ULTIMO_NIVEL).fill(0).map(n => Math.floor(Math.random() * 4));
    }

    siguienteNivel(){
    
        const celeste = document.getElementById('celeste')
        const violeta = document.getElementById('violeta')
        const naranja = document.getElementById('naranja')
        const verde = document.getElementById('verde')

        this.colores = {
            //celeste: celeste, esto es equivalente.
            celeste,
            violeta,
            naranja,
            verde
        }

        this.coloresArray = Object.values(this.colores);
    
        this.subnivel = 0;  
        nivel.innerHTML = this.nivel;
        this.progreso = 100 / this.nivel;
        this.porcentaje = 0;
        this.contador = TIEMPO_MAX;

        this.actualizarProgreso(this.porcentaje);
        this.iluminarSecuencia()
            .then(() => {
                this.subnivel = 0;
                this.contadorDeTiempo();
                this.agregarEventos();
            });
    }

    contadorDeTiempo() {
        //PID del contador(this.cronometro)
        this.cronometro = setInterval(() => {
          this.contador--;
          if (this.contador === 0) {
            this.perderJuego();
          } else {
            tiempo.innerText = this.contador;
          }
        }, 1000);
      }

    iluminarSecuencia(){
        return new Promise((resolve) => {
            for(let i = 0; i < this.nivel; i++){
                const color = Juego.transformarNumeroAColor(this.secuencia[i]);
                delay(1000 * i)
                    .then(this.iluminarColor.bind(this, color, resolve));
            }
        });
    }

    iluminarColor(color, resolve){
        this.colores[color].classList.add('target', 'light')
        blip.play();
        delay(350)
            .then(this.apagarColor.bind(this, color, resolve));
    }

    apagarColor(color, resolve){
        this.colores[color].classList.remove('target', 'light');
        if(resolve){
            this.subnivel++;
            if(this.subnivel === this.nivel){
                resolve();
            }
        }
    }

    agregarEventos(){
        this.coloresArray.forEach(colores => {
            colores.addEventListener('click', this.elegirColor); 
        });
    }

    eliminarEventos(){
        this.coloresArray.forEach(colores => {
            colores.removeEventListener('click',this.elegirColor);
        });
    }

    actualizarProgreso(porcentaje){
        barraProgreso.style.width = `${porcentaje}%`;
    }

    elegirColor(e){

        const nombreColor = e.target.dataset.color;
        const numeroColor = Juego.transformarColorANumero(nombreColor);
        this.iluminarColor(nombreColor) ;
        
        if(numeroColor === this.secuencia[this.subnivel]){
           
            this.subnivel++;
            this.porcentaje += this.progreso;
            this.agregarPuntos();
            this.actualizarProgreso(this.porcentaje)

            if(this.subnivel === this.nivel){
                this.nivel++;
                this.eliminarEventos();
                this.pararContador();
                if(this.nivel === (ULTIMO_NIVEL + 1)){
                    this.ganoJuego();
                }else{
                    Juego.generarColores(this.colores)
                    swal('¿Listo para más?', `ir al nivel ${this.nivel}`, 'success')
                        .then(() => {
                            
                            this.actualizarProgreso(0)
                            return delay(600)
                        })
                        .then(this.siguienteNivel);
                }
            }

        }else{
            this.perderJuego();
        }
    }

    agregarPuntos(){
        puntos.innerHTML = parseInt(puntos.innerHTML) + TOTAL_PUNTOS;
    }

    ganoJuego(){
        swal('Simon Dice', 'Felicitaciones, ganaste el juego', 'success')
            .then(() =>{
                this.inicializar();
            });
    }

    perderJuego(){
        this.pararContador();
        swal('Perdiste', `Total de puntos: ${puntos.innerHTML}`, 'error')
        .then(() =>{
            this.eliminarEventos();
            this.inicializar();
        });
    }

    pararContador(){
        clearInterval(this.cronometro);
        tiempo.innerHTML = TIEMPO_MAX;
    }

    
    static transformarNumeroAColor(numero){
        switch(numero){
            case 0:
                return 'celeste';
            case 1:
                return 'violeta';
            case 2:
                return 'naranja';
            case 3:
                return 'verde';
        }
    }

    static transformarColorANumero(color){
        switch(color){
            case 'celeste':
                return 0;
            case 'violeta':
                return 1;
            case 'naranja':
                return 2;
            case 'verde':
                return 3;
        }
    }

    static generarColores(oldColores){

        const coloresId = [0, 1, 2, 3]
        coloresId.sort(() => Math.random() - 0.5)
    
        coloresId.forEach(id => {

            const color = Juego.transformarNumeroAColor(id);
            const div = document.createElement('div')
        
            div.setAttribute('id', color)
            div.setAttribute('class', `color ${color}`)
            div.setAttribute('data-color', color)

            if(oldColores){
                gameboard.removeChild(oldColores[color])
                gameboard.appendChild(div)
            }else{
                gameboard.appendChild(div)
            }
        })
    }
}



Juego.generarColores(this.colores)

function empezarJuego(e){
    window.juego = new Juego(); //Poner esta variable dentro de windows, para poder debugearla. 
    //var juego = new Juego();
}

boton.addEventListener('click', empezarJuego);






