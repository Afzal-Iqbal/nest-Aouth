import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';  

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService, 
    ) { }

    async register(CreateUserDto: CreateUserDto): Promise<{
        message: string;
        token: string;
        user: { id: string; email: string; name: string };
    }> {
        const { email, password, name } = CreateUserDto;

        // Check if user exists
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new this.userModel({
            email,
            password: hashedPassword,
            name,
        });

        await user.save();

        // Generate token
        const token = this.generateToken({
            _id: user._id.toString(),
            email: user.email,
        });

        return {
            message: 'User registered successfully',
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
            },
        };
    }

    async login(loginDto: LoginDto): Promise<{
        message: string;
        token: string;
        user: { id: string; email: string; name: string };
    }> {
        const { email, password } = loginDto;

        // Find user
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate token
        const token = this.generateToken({
            _id: user._id.toString(),
            email: user.email,
        });

        return {
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
            },
        };
    }

    private generateToken(user: { _id: string; email: string }): string {
        const payload = {
            _id: user._id,
            email: user.email,
        };
        return this.jwtService.sign(payload); 
    }
}
