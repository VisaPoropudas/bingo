import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Container, Row, Col, Card, Button, Badge, ListGroup } from 'react-bootstrap';
import './Player.css';

const GameList = ({ onJoinGame }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
    // Päivitä lista säännöllisesti
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const q = query(
        collection(db, 'games'),
        where('status', 'in', ['waiting', 'active'])
      );
      const gamesSnapshot = await getDocs(q);
      const gamesData = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGames(gamesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading games:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Ladataan...</span>
        </div>
        <p className="mt-3">Ladataan pelejä...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Käynnissä olevat pelit</h2>

      {games.length === 0 ? (
        <Card className="text-center shadow-sm">
          <Card.Body className="py-5">
            <h4 className="text-muted mb-3">Ei käynnissä olevia pelejä</h4>
            <p className="text-muted">Tarkista hetken kuluttua uudelleen</p>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {games.map(game => (
            <Col key={game.id}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>{game.name}</strong>
                  <Badge bg={game.status === 'active' ? 'success' : 'warning'}>
                    {game.status === 'waiting' ? 'Odottaa' : 'Käynnissä'}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush" className="mb-3">
                    <ListGroup.Item className="px-0">
                      <small className="text-muted">Isäntä:</small><br />
                      <strong>{game.hostName}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="px-0">
                      <small className="text-muted">Palloja arvottu:</small><br />
                      <strong>{game.calledBalls?.length || 0} / 75</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="px-0">
                      <small className="text-muted d-block mb-2">Voittotavat:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {game.winConditions?.horizontal && <Badge bg="info">Vaakarivit</Badge>}
                        {game.winConditions?.vertical && <Badge bg="info">Pystyrivit</Badge>}
                        {game.winConditions?.diagonal && <Badge bg="info">Diagonaalit</Badge>}
                        {game.winConditions?.corners && <Badge bg="info">Kulmat</Badge>}
                        {game.winConditions?.fullCard && <Badge bg="info">Koko ruudukko</Badge>}
                      </div>
                    </ListGroup.Item>
                    {game.requiredLines > 1 && (
                      <ListGroup.Item className="px-0">
                        <small className="text-muted">Vaaditut linjat:</small><br />
                        <Badge bg="warning" text="dark">{game.requiredLines}</Badge>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
                <Card.Footer className="bg-white border-top-0">
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={() => onJoinGame(game.id)}
                  >
                    Liity peliin
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default GameList;
