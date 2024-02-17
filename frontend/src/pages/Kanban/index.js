import React, { useState, useEffect, useReducer, useContext, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1),
  },
  button: {
    background: "#10a110",
    border: "none",
    padding: "10px",
    color: "white",
    fontWeight: "bold",
    borderRadius: "5px",
  },
  
}));

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();

  const [tags, setTags] = useState([]);
  const [reloadData, setReloadData] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);


  const fetchTags = async () => {
    try {
      const response = await api.get("/tags/kanban");
      const fetchedTags = response.data.lista || []; 

      setTags(fetchedTags);

      // Fetch tickets after fetching tags
      await fetchTickets(jsonString);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const [file, setFile] = useState({
    lanes: []
  });


  const [tickets, setTickets] = useState([]);
  const { user } = useContext(AuthContext);
  const { profile, queues } = user;
  const jsonString = user.queues.map(queue => queue.UserQueue.queueId);

  const fetchTickets = async (jsonString) => {
    try {
      
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(jsonString),
          teste: true
        }
      });
      setTickets(data.tickets);
    } catch (err) {
      ;
      setTickets([]);
    }
  };


  const popularCards = (jsonString) => {
    const filteredTickets = tickets.filter(ticket => ticket.tags.length === 0);

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("kanban.defaults.lane"),
        label: "0",
        cards: filteredTickets.map(ticket => ({
          id: ticket.id.toString(),
          label: "Ticket nº " + ticket.id.toString(),
          description: (
              <div>
                <p>
                  {ticket.contact.number}
                  <br />
                  {ticket.lastMessage}
                </p>
                <button 
                  className={classes.button} 
                  onClick={() => {
                    handleCardClick(ticket.uuid)
                  }}>
                    Ver Ticket
                </button>
              </div>
            ),
          title: ticket.contact.name,
          draggable: true,
          href: "/tickets/" + ticket.uuid,
        })),
      },
      ...tags.map(tag => {
        const filteredTickets = tickets.filter(ticket => {
          const tagIds = ticket.tags.map(tag => tag.id);
          return tagIds.includes(tag.id);
        });

        return {
          id: tag.id.toString(),
          title: tag.name,
          label: tag.id.toString(),
          cards: filteredTickets.map(ticket => ({
            id: ticket.id.toString(),
            label: "Ticket nº " + ticket.id.toString(),
            description: (
              <div>
                <p>
                  {ticket.contact.number}
                  <br />
                  {ticket.lastMessage}
                </p>
                <button 
                  className={classes.button} 
                  onClick={() => {
                    handleCardClick(ticket.uuid)
                  }}>
                    Ver Ticket
                </button>
              </div>
            ),
            title: ticket.contact.name,
            draggable: true,
            href: "/tickets/" + ticket.uuid,          
          })),
          style: { backgroundColor: tag.color, color: "white" }
        };
      }),
    ];

    setFile({ lanes });
  };

  const handleCardClick = (uuid) => {  
    history.push('/tickets/' + uuid);
  };

  useEffect(() => {
    popularCards(jsonString);
}, [tags, tickets, reloadData]);

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
          if(cardId !==sourceLaneId ){
            await api.post(`https://app.autoatende.com/tags/${targetLaneId}/${sourceLaneId}/${cardId}`)
            toast.success('Ticket Atualizado com Sucesso!');
          }
        }catch (err) {
          ;
        }
  };

  const handleDelete = async(cardId, laneId) =>{
    if(cardId && laneId !== 'lane0'){
      await api.delete(`/tags/${cardId}/${laneId}`);
      toast.success('Ticket Tag Removido!');
    }else{
      toast.success('Não é possível remover um Ticket Tag em Aberto!');
    }
  };

  return (
    <div className={classes.root}>
      <Board 
		    data={file} 
        onCardDelete={handleDelete}
		    onCardMoveAcrossLanes={handleCardMove} 
      />
    </div>
  );
};

export default Kanban;