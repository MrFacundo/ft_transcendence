import math
import random

def truncate(n, decimals=0) -> float:
    multiplier = 10 ** decimals
    return int(n * multiplier) / multiplier

class Hitbox:
    def __init__(self, x, y, width, height):
        self.x: float = x
        self.y: float = y
        self.width: float = width
        self.height: float = height
        
    def collides(self, other: "Hitbox") -> bool:
        if self.x > other.x and self.x < other.x + other.width:
            if (self.y > other.y and self.y < other.y + other.height) or \
               (self.y + self.height > other.y and self.y + self.height < other.y + other.height):
                return True
                
        if self.x + self.width > other.x and self.x + self.width < other.x + other.width:
            if (self.y > other.y and self.y < other.y + other.height) or \
               (self.y + self.height > other.y and self.y + self.height < other.y + other.height):
                return True
        return False

class Paddle(Hitbox):
    def __init__(self, x):
        super().__init__(x, 0.5 - 0.075, 0.02, 0.25)
        self.moving: float = 0

    def update(self):
        self.y = truncate(self.y + self.moving, 2)
        if self.y < 0:
            self.y = 0
        elif self.y + self.height > 1:
            self.y = 1 - self.height

class Ball(Hitbox):
    def __init__(self, x, y):
        super().__init__(x, y, 0.02, 0.02)
        self._init_velocity()

    def _init_velocity(self):
        initial_speed = 0.04
        initial_angle = random.uniform(-math.pi/4, math.pi/4)
        self.speed_x = abs(initial_speed * math.cos(initial_angle))
        self.speed_y = initial_speed * math.sin(initial_angle)

    def calculate_angle(self, paddle):
        impact_position = (self.y + self.height/2 - (paddle.y + paddle.height/2)) / (paddle.height/2)
        max_angle = math.pi/4
        angle = impact_position * max_angle
        speed = math.sqrt(self.speed_x**2 + self.speed_y**2)
        self.speed_x = speed * math.cos(angle) * (-1 if self.speed_x > 0 else 1)
        self.speed_y = speed * math.sin(angle)

    def update(self):
        self.x = truncate(self.x + self.speed_x, 2)
        self.y = truncate(self.y + self.speed_y, 2)
        
        if self.y <= 0:
            self.y = 0
            self.speed_y = abs(self.speed_y)
        elif self.y + self.height >= 1:
            self.y = 1 - self.height
            self.speed_y = -abs(self.speed_y) 