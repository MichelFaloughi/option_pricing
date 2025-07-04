from Option import Option

class BarrierOption(Option):

    def __init__(self,  K: float,           # strike price
                        T: int,             # maturity
                        style: str,         # American or European
                        type: str,          # Call or Put
                        barrier: float,     # barrier level
                        direction: str,     # 'up' or 'down'
                        knock_type: str,    # 'knock-in' or 'knock-out'
                    ):
        
        super().__init__(K, T, style, type)
        self.barrier = barrier
        self.direction = direction  # 'up' or 'down'
        self.knock_type = knock_type  # 'knock-in' or 'knock-out'

        assert direction in ['up', 'down'], "Direction must be either 'up' or 'down'"
        assert knock_type in ['knock-in', 'knock-out'], "Knock type must be either 'knock-in' or 'knock-out'"
        assert barrier >= 0, "Barrier must be a non-negative float"
