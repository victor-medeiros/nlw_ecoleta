import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './styles.css';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import logo from '../../assets/logo.svg';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUfs {
    sigla: string;
}

interface IBGECities {
    nome: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [uf, setUf] = useState<string>('0');
    const [cities, setCities] = useState<string[]>([]);
    const [city, setCity] = useState<string>('0');
    const [position, setPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();
    
    useEffect(() => {
        api.get('/items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios.get<IBGEUfs[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        })
    }, []);

    useEffect(() => {
        axios.get<IBGECities[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`).then(response => {
            setCities(response.data.map(city => city.nome));
        })
    }, [uf]);

    useEffect(() => {
        if(uf === '0'){
            return;
        }
    });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const {latitude, longitude} = position.coords;
            setPosition([latitude, longitude]);
        });
    }, [])

    function handleUfSelect(event: ChangeEvent<HTMLSelectElement>){
        setUf(event.target.value);
    }
    
    function handleCitySelect(event: ChangeEvent<HTMLSelectElement>){
        setCity(event.target.value);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        const {lat, lng} = event.latlng;
        setPosition([lat, lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setFormData( { ...formData, [name]: value });
    }

    function handleItemClick(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);

        }else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    function handleSubmit(event: FormEvent){
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const [ latitude, longitude ] = position;
        const items = selectedItems;

        if(uf === '0'){
            return alert('Selecione um Estado.')
        }
        
        if(city === '0'){
            return alert('Selecione uma cidade.')
        }
        
        if(items.length === 0) {
            return alert('Selecione pelo menos um ítem de coleta.')
        }

        const data = {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            uf,
            city,
            items
        };

        api.post('/point', data);

        history.push('/');

        return alert('Ponto de coleta dastrado!');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <span><FiArrowLeft /></span>
                    Voltar para home</Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            required
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type="email"
                                name="email"
                                id="email"
                                required
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">whatsapp</label>
                            <input 
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                required
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={position} zoom={15} onclick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={position} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={uf} required onChange={handleUfSelect}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={city} required onChange={handleCitySelect}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens de coleta</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                                <li key={item.id} 
                                    onClick={() => handleItemClick(item.id)}
                                    className={selectedItems.includes(item.id) ? 'selected' : ''}
                                >
                                    <img src={item.image_url} alt={item.title} />
                                    <span>{item.title}</span>
                                </li>
                            )
                        )}
                        
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;